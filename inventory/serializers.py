from rest_framework import serializers
from .models import User, Category, Warehouse, Product, Inventory, StockLog

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'first_name', 'last_name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = Product
        fields = ['product_id', 'name', 'sku', 'category', 'category_details', 'description', 'image']

    def validate(self, data):
        # Unique SKU check scoped to the warehouse
        sku = data.get('sku')
        category = data.get('category')
        
        # If this is an update, exclude the current instance from the check
        instance = self.instance
        
        if sku and category:
            # Find existing products with the same SKU in the same warehouse (via category)
            # We assume the category belongs to the warehouse we are checking.
            # (The ViewSet enforces that the category belongs to the user's warehouse)
            
            existing_products = Product.objects.filter(
                sku=sku, 
                category__warehouse=category.warehouse
            )
            
            if instance:
                existing_products = existing_products.exclude(pk=instance.pk)
            
            if existing_products.exists():
                raise serializers.ValidationError({"sku": "A product with this SKU already exists in your warehouse."})
        
        return data

class InventorySerializer(serializers.ModelSerializer):
    # Read-only nested details for display
    product_details = ProductSerializer(source='product', read_only=True)
    warehouse_details = WarehouseSerializer(source='warehouse', read_only=True)
    
    # Read-Write fields (returns ID in GET, expects ID in POST/PUT)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())

    class Meta:
        model = Inventory
        fields = ['inventory_id', 'warehouse', 'warehouse_details', 'product', 'product_details', 'quantity', 'last_updated']
        validators = []





class StockLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLog
        fields = '__all__'
