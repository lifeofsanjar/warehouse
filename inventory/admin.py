from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Warehouse, Product, Inventory, StockLog

# Register the custom user model
admin.site.register(User, UserAdmin)

# Register other models
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'name')

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('warehouse_id', 'name', 'location', 'owner_user')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_id', 'name', 'sku', 'category')
    search_fields = ('name', 'sku')

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('inventory_id', 'product', 'warehouse', 'quantity', 'last_updated')
    list_filter = ('warehouse',)

@admin.register(StockLog)
class StockLogAdmin(admin.ModelAdmin):
    list_display = ('log_id', 'product', 'warehouse', 'user', 'action_type', 'quantity_change', 'timestamp')
    list_filter = ('action_type', 'timestamp')