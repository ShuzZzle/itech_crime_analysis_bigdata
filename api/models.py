from django.db import models

# Create your models here.


class Crimes(models.Model):
    case_number = models.CharField(max_length=255)
    date = models.DateTimeField()
    block = models.CharField(max_length=50)
    iucr = models.CharField(max_length=50)
    primary_type = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    location_description = models.TextField()
    arrest = models.BooleanField()
    domestic = models.BooleanField()
    beat = models.CharField(max_length=125)
    district = models.CharField(max_length=125)
    ward = models.CharField(max_length=125)
    community_area = models.CharField(max_length=125)
    fbi_code = models.CharField(max_length=125)
    updated_on = models.DateTimeField(max_length=125)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)


