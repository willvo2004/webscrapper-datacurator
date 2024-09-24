from sqlalchemy import create_engine
import pandas as pd
import psycopg2

connection_string = "postgresql://williamvo@localhost:5432/response"
db = create_engine(connection_string)
conn = db.connect()

pdf = pd.read_json("positive_responses.json")
ndf = pd.read_json("negative_response.json")
mdf = pd.read_json("neutral_response.json")

pdf.to_sql("sampled_positive_responses", db, if_exists="replace")
ndf.to_sql("sampled_negative_responses", db, if_exists="replace")
mdf.to_sql("sampled_neutral_responses", db, if_exists="replace")


connection = psycopg2.connect(connection_string)
connection.autocommit = True
curosr = connection.cursor()
