from rest_framework_json_api import serializers
from django.db.models.query import RawQuerySet


class CrimeSerializer(serializers.Serializer):

    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass

    def to_representation(self, instance):
        try:
            data = vars(instance)
            if '_state' in data.keys():
                del data["_state"]
            return data
        except:
            if 'year' in instance.keys():
                instance['year'] = instance['year'].strftime("%Y")
            return instance
