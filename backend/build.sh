#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput

# Drop existing tables using Python raw SQL execution
python -c "
import os, dj_database_url, psycopg2
db_config = dj_database_url.parse(os.environ.get('DATABASE_URL'))
if db_config:
    conn = psycopg2.connect(
        dbname=db_config['NAME'],
        user=db_config['USER'],
        password=db_config['PASSWORD'],
        host=db_config['HOST'],
        port=db_config['PORT']
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
    cursor.close()
    conn.close()
    print('Successfully reset database schema!')
"

# Run migrations on clean database
python manage.py migrate