from rest_framework_json_api.pagination import JsonApiLimitOffsetPagination


class MyLimitPagination(JsonApiLimitOffsetPagination):
    offset_query_param = 'offset'
    limit_query_param = 'limit'
    default_limit = 3
    max_limit = None
