from flask import Flask, render_template, request, redirect, session, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mysqldb import MySQL
import MySQLdb.cursors
from flask import jsonify
from collections import defaultdict 
grouped = defaultdict(float)
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import io
from collections import defaultdict
from datetime import datetime

#  INIT APP
app = Flask(__name__)
app.secret_key = 'secret123'

# 🗄️ DATABASE CONFIG
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'subscription_bill_reminder'

mysql = MySQL(app)

# 
# 🏠 LOGIN PAGE
# 
@app.route('/')
def home():
    return render_template('signup.html')

@app.route('/loginpage')
def loginpage():
    return render_template('login.html')

# 
# 📝 SIGNUP PAGE + LOGIC
# 
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['emails']
        password = request.form['passw']

        hashed_password = generate_password_hash(password)

        cursor = mysql.connection.cursor()

        cursor.execute("SELECT * FROM loginform WHERE email=%s", (email,))
        existing = cursor.fetchone()

        if existing:
            return "⚠️ Email already exists"

        cursor.execute(
            "INSERT INTO loginform (username,email,passw) VALUES (%s,%s,%s)",
            (username, email, hashed_password)
        )
        mysql.connection.commit()

        return redirect('/')

    return render_template('signup.html')

# 
# 🔐 LOGIN
# 
@app.route('/login', methods=['POST'])
def login():
    email = request.form['emails']
    password = request.form['passw']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute("SELECT * FROM loginform WHERE email=%s", (email,))
    user = cursor.fetchone()

    if user and check_password_hash(user['passw'], password):
        session['loggedin'] = True
        session['username'] = user['username']
        session['email'] = user['email']
        return redirect('/dashboard')

    # ✅ VERY IMPORTANT (FIX)
    return render_template('login.html', error=True)
    

    # 
# 📄 DETAILS PAGE
# 
@app.route('/details')
def details():
    if 'loggedin' in session:
        return render_template('dashnewbill_details.html')
    return redirect('/')

@app.route('/add_bill', methods=['POST'])
def add_bill():
    if 'email' not in session:
        return "Session expired ❌"

    email = session['email']
    bill_name = request.form['bill_name']
    amount = request.form['amount']
    due = request.form['due']

    print("Saving bill for:", email)  # DEBUG
    

    cursor = mysql.connection.cursor()
    cursor.execute(
        "INSERT INTO bills (email, bill_name,amount, due) VALUES (%s, %s, %s, %s)",
        (email, bill_name, amount, due)
    )
    mysql.connection.commit()

    return redirect('/dashboard')


@app.route('/get_bills')
def get_bills():
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute("SELECT * FROM bills WHERE email=%s AND status!='hidden'", (session['email'],))
    bills = cursor.fetchall()
    return jsonify(bills)



#to paid or delete bill button
@app.route('/mark_paid/<int:id>')
def mark_paid(id):
    cursor = mysql.connection.cursor()
    cursor.execute("UPDATE bills SET status='paid' WHERE id=%s", (id,))
    mysql.connection.commit()
    return "OK"

@app.route('/hide_bill/<int:id>')
def hide_bill(id):
    cursor = mysql.connection.cursor()
    cursor.execute("UPDATE bills SET status='hidden' WHERE id=%s", (id,))
    mysql.connection.commit()
    return "OK"

# 📊 DASHBOARD
@app.route('/dashboard')
def dashboard():
    if 'loggedin' not in session:
        return redirect('/')

    email = session['email']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    cursor.execute("SELECT * FROM bills WHERE email=%s", (email,))
    bills = cursor.fetchall()

    return render_template(
        'dash2.html',
        username=session['username'],
        email=email,
        bills=bills
    )
    return redirect('/')



        

# =========================
# 🚪 LOGOUT
# =========================
@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# =========================
# 📊 GRAPH PAGE
# =========================
@app.route('/graph')
def graph():
    return render_template('graph.html')

# profile
@app.route('/profile')
def profile():
    if 'loggedin' in session:
        return render_template(
            'profile.html',
            username=session['username'],
            email=session['email']
        )
    return redirect('/dash2.html')

# calendar
@app.route('/calendar')
def calendar():
    if 'loggedin' in session:
        return render_template('calendar.html')
    return redirect('/dash2.html')


# =========================
# 📈 HISTOGRAM
# =========================
@app.route('/histogram')
def histogram():

    if 'loggedin' not in session:
        return "Unauthorized"

    email = session['email']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute("SELECT amount, due FROM bills WHERE email=%s", (email,))
    bills = cursor.fetchall()

    from collections import defaultdict
    grouped = defaultdict(float)

    # ✅ CORRECTLY INSIDE FUNCTION
    for bill in bills:
        try:
            date = bill['due']

            if isinstance(date, str):
                date = datetime.strptime(date, "%Y-%m-%d")

            amount = float(bill['amount'])

            key = date.strftime("%b")
            grouped[key] += amount

        except Exception as e:
            print("ERROR:", e)

    labels = list(grouped.keys())
    values = list(grouped.values())

    plt.figure()
    plt.bar(labels, values)

    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    return send_file(img, mimetype='image/png')
    return redirect('/dash2.html')

# 🚀 RUN
if __name__ == '__main__':

    app.run(debug=True)