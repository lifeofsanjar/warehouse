from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    role = models.CharField(max_length=50, blank=True, null=True)
    
    # specific related_names to avoid clashes with default auth.User if necessary, 
    # but since we are setting AUTH_USER_MODEL, it should be fine.
    
    class Meta:
        db_table = 'users'

class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    warehouse = models.ForeignKey('Warehouse', on_delete=models.CASCADE, related_name='categories', null=True, blank=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class Warehouse(models.Model):
    warehouse_id = models.AutoField(primary_key=True)
    owner_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_warehouses')
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)

    class Meta:
        db_table = 'warehouses'

    def __str__(self):
        return self.name

class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

class Inventory(models.Model):
    inventory_id = models.AutoField(primary_key=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='inventory_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_locations')
    quantity = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory'
        verbose_name_plural = 'Inventory'
        unique_together = ('warehouse', 'product')

class StockLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='logs')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performed_logs')
    action_type = models.CharField(max_length=50)
    quantity_change = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_logs'