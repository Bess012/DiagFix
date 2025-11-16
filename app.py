from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

with open("data/clients.json", "r") as f:
    client_data = json.load(f)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/check", methods=["POST"])
def check():
    try:
        number = request.form.get("phone")  
        result = client_data.get(number, {"problem": "No data found"})
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/get_all_clients", methods=["GET"])
def get_all_clients():
    """Route pour récupérer tous les clients (mode admin)"""
    try:
        return jsonify(client_data)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/repair", methods=["POST"])
def repair():
    try:
        number = request.form.get("phone")
        
        client_data[number] = {
            "problem": "Aucun problème",
            "severity": "resolved",
            "last_checked": datetime.now().strftime("%d/%m/%Y"),
            "bill_due": False
        }
        
        with open("data/clients.json", "w") as f:
            json.dump(client_data, f, indent=4)
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)