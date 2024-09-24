from textwrap import indent
from sqlalchemy import create_engine
import pandas as pd
import psycopg2

connection_string = "postgresql://williamvo@localhost:5432/instruction"
db = create_engine(connection_string)
conn = db.connect()

rdf = pd.read_json("response_instructions.json")
idf = pd.read_json("insight_instruction.json")

rdf.to_sql("response", db, if_exists="replace")
idf.to_sql("insight", db, if_exists="replace")


conn = psycopg2.connect(connection_string)
conn.autocommit = True
cursor = conn.cursor()
