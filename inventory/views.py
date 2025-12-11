from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from drf_spectacular.utils import extend_schema, OpenApiExample
from .models import User, Category, Warehouse, Product, Inventory, StockLog
from .serializers import (
    UserSerializer, CategorySerializer, WarehouseSerializer, 
    ProductSerializer, InventorySerializer, StockLogSerializer
)

class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Get the first warehouse owned by the user, if any
        warehouse = user.owned_warehouses.first()
        warehouse_id = warehouse.warehouse_id if warehouse else None
        warehouse_name = warehouse.name if warehouse else None

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'warehouse_id': warehouse_id,
            'warehouse_name': warehouse_name
        })


class UserViewSet(viewsets.ModelViewSet):
    # Strict control: Only admins can manage users (manual onboarding per business logic)
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @extend_schema(
        description="Create a new user. Password is required.",
        examples=[
            OpenApiExample(
                'User Example',
                value={
                    "username": "newuser",
                    "password": "strongpassword123",
                    "email": "user@example.com",
                    "role": "manager",
                    "first_name": "John",
                    "last_name": "Doe"
                },
                request_only=True,
            )
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        # Isolation: Users only see categories for their own warehouse
        return Category.objects.filter(warehouse__owner_user=self.request.user)

    def perform_create(self, serializer):
        # Auto-assign warehouse
        warehouse = self.request.user.owned_warehouses.first()
        if not warehouse:
            raise ValidationError({"detail": "You do not have a warehouse assigned."})
        serializer.save(warehouse=warehouse)

class WarehouseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WarehouseSerializer
    
    def get_queryset(self):
        return Warehouse.objects.filter(owner_user=self.request.user)

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Isolation: Filter products by categories belonging to user's warehouse
        return Product.objects.filter(category__warehouse__owner_user=self.request.user)

class InventoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InventorySerializer

    def get_queryset(self):
        # Isolation: Users only see inventory for their own warehouse
        return Inventory.objects.filter(warehouse__owner_user=self.request.user).select_related('product', 'warehouse')

    def perform_create(self, serializer):
        # Enforce user's warehouse
        warehouse = self.request.user.owned_warehouses.first()
        if not warehouse:
            raise ValidationError({"detail": "You do not have a warehouse assigned."})
            
        product = serializer.validated_data.get('product')
        quantity = serializer.validated_data.get('quantity', 0)
        
        # Validate that the product belongs to a category in the user's warehouse
        if product.category.warehouse != warehouse:
             raise ValidationError({"product": "This product does not belong to your warehouse."})

        with transaction.atomic():
            # Ensure we get the item or create with 0, then atomically add
            inventory_item, created = Inventory.objects.get_or_create(
                warehouse=warehouse,
                product=product,
                defaults={'quantity': 0}
            )

            # Atomic update using F()
            inventory_item.quantity = F('quantity') + quantity
            inventory_item.save()
            
            # Refresh to get the actual final value for response/logging
            inventory_item.refresh_from_db()

            serializer.instance = inventory_item
            
            # Create Audit Log
            StockLog.objects.create(
                product=product,
                warehouse=warehouse,
                user=self.request.user,
                action_type='INBOUND' if quantity > 0 else 'OUTBOUND',
                quantity_change=quantity
            )

    def perform_update(self, serializer):
        # Enforce isolation on update
        instance = serializer.instance
        if instance.warehouse.owner_user != self.request.user:
             raise ValidationError({"detail": "You do not have permission to update this inventory."})

        # Handle manual updates (PUT/PATCH) - e.g. corrections
        with transaction.atomic():
            old_quantity = instance.quantity
            
            # Save the new state
            instance = serializer.save()
            
            new_quantity = instance.quantity
            diff = new_quantity - old_quantity
            
            if diff != 0:
                StockLog.objects.create(
                    product=instance.product,
                    warehouse=instance.warehouse,
                    user=self.request.user,
                    action_type='ADJUSTMENT',
                    quantity_change=diff
                )

class StockLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StockLogSerializer
    
    def get_queryset(self):
        return StockLog.objects.filter(warehouse__owner_user=self.request.user)
