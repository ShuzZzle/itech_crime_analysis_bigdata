from api.models import Crimes
from api.serializers import CrimeSerializer
from rest_framework import viewsets, views, generics
from django.db.models import Count
import datetime
from django.db.models.functions import TruncYear


class CrimeView(viewsets.ModelViewSet):
    queryset = Crimes.objects.all()
    serializer_class = CrimeSerializer

    def get_queryset(self):
        queryset = Crimes.objects.all()
        group = self.request.query_params.get('group', None)
        if group is not None:
            byear = "year" in group.split(",")
            groups = group.split(",")
            if byear:
                groups.remove("year")
                if len(groups) == 0:
                    return Crimes.objects.raw("SELECT id, YEAR(date) AS year, count(id) AS count FROM api_crimes GROUP BY year ORDER BY count;")

            queryset = queryset.values(*groups).annotate(count=Count('id'))
            if byear:
                queryset = queryset.annotate(year=TruncYear('date'))

            #omegalul
            queryset = queryset.order_by('year')

        return queryset

