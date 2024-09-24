from sqlalchemy import create_engine
import pandas as pd
import psycopg2

connection_string = "postgresql://williamvo@localhost:5432/response"
db = create_engine(connection_string)
conn = db.connect()

pdf = pd.read_json("positive_responses.json")
ndf = pd.read_json("negative_response.json")
mdf = pd.read_json("neutral_response.json")


def write_positive():
    response = pdf["owner_response"]
    response.to_sql("positie_response", db, if_exists="replace")


connection = psycopg2.connect(connection_string)
connection.autocommit = True
curosr = connection.cursor()

write_positive()
