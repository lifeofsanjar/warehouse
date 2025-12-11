from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, CategoryViewSet, WarehouseViewSet, 
    ProductViewSet, InventoryViewSet, StockLogViewSet,
    CustomLoginView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'stock-logs', StockLogViewSet, basename='stocklog')

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='api_login'),
    path('', include(router.urls)),
]

