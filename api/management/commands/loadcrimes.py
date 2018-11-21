from django.core.management.base import BaseCommand, CommandError
from api.models import Crimes
import datetime
import csv
import os
import pytz


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('path', nargs='+', type=str)

        parser.add_argument(
            '--max-size',
            dest='max_size',
            type=int,
            help='Loads the specified amount of lines',
        )

    @staticmethod
    def parse_date(old_date):
        tz = pytz.timezone('America/Chicago')
        date = datetime.datetime.strptime(old_date, "%m/%d/%Y %I:%M:%S %p")
        return tz.localize(date)

    @staticmethod
    def parse_boolean(string):
        if string == 'true':
            return True
        elif string == 'false':
            return False
        else:
            raise ValueError

    @staticmethod
    def parse_float(string):
        if string == "":
            return None
        try:
            return float(string)
        except ValueError:
            print("Error: " + string)

    def insert(self, array):
        pass

    def handle(self, *args, **options):
        crime_list = []
        processed_lines = 0
        max_size = 0

        Crimes.objects.all().delete()

        if not options['path']:
            self.stderr.write(self.style.ERROR("WTF"))

        if options['max_size']:
            max_size = options['max_size']

        filepath = ''.join(options['path'])
        filepath = filepath.replace('\u202a', '')

        with open(filepath, "r") as csvfile:
            datareader = csv.DictReader(csvfile, delimiter=',')
            # next(datareader)  # yield the header row FUCK DAT SHIT
            for row in datareader:
                processed_lines += 1
                if max_size != 0 and processed_lines > max_size:
                    break
                crime = Crimes(
                    case_number=row["Case Number"],
                    date=self.parse_date(row["Date"]),
                    block=row["Block"],
                    iucr=row["IUCR"],
                    primary_type=row["Primary Type"],
                    description=row["Description"],
                    location_description=row["Location Description"],
                    arrest=self.parse_boolean(row["Arrest"]),
                    domestic=self.parse_boolean(row["Domestic"]),
                    beat=row["Beat"],
                    district=row["District"],
                    ward=row["Ward"],
                    community_area=row["Community Area"],
                    fbi_code=row["FBI Code"],
                    updated_on=self.parse_date(row["Updated On"]),
                    longitude=self.parse_float(row["Longitude"]),
                    latitude=self.parse_float(row["Latitude"])
                )
                crime_list.append(crime)
                if processed_lines % 5000 == 0:
                    Crimes.objects.bulk_create(
                        crime_list,
                        batch_size=5000
                    )
                    print("\rProcessed: {} Crime Objects".format(processed_lines), end="")
                    crime_list = list()
            Crimes.objects.bulk_create(
                crime_list,
                batch_size=5000
            )
        self.stdout.write(self.style.SUCCESS('Successfully parsed dataset!'))
