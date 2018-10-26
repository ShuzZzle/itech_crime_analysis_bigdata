from rest_framework_json_api.views import ModelViewSet
from api.models import Crimes
from api.serializers import CrimeSerializer


class CrimeViewSet(ModelViewSet):
    queryset = Crimes.objects.all()
    serializer_class = CrimeSerializer
