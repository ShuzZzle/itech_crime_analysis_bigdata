from rest_framework_json_api import serializers
from api.models import Crimes


class CrimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crimes
        fields = '__all__'
