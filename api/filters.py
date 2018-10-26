import re
from rest_framework_json_api.filters import QueryParameterValidationFilter


class MyQPValidator(QueryParameterValidationFilter):
    query_regex = re.compile(r'^(sort|include|page|page_size)$|^(filter|fields|page)(\[[\w\.\-]+\])?$')
