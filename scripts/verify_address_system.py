import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8080"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("==================================================")
    print("RUNNING STUDENT HOME ADDRESS SYSTEM VERIFICATIONS")
    print("==================================================")

    # 1. Login as Admin
    print("\n[Step 0] Logging in as Admin (admin@sitcoe.ac.in)...")
    status, res = make_request("/api/v1/auth/login", method="POST", data={
        "email": "admin@sitcoe.ac.in",
        "password": "admin123"
    })
    if status != 200:
        print(f"Admin login failed: status={status}, res={res}")
        sys.exit(1)
    admin_token = res["token"]
    print("✓ Admin login successful. Token acquired.")

    # 2. Test 1: Register/Add a student with valid Indian PIN code
    print("\n[Test 1] Student registration with valid Indian PIN code (416115)...")
    student_payload = {
        "prn": "PRN2026TEST01",
        "rollNo": "TEST-01",
        "name": "Prathamesh Patil",
        "email": "prathamesh.patil@sitcoe.org.in",
        "department": "CSE",
        "academicYear": "SE",
        "division": "Div A",
        "batchGroup": "A1",
        "cohortBatch": "2024-2028",
        "gpa": 8.85,
        "attendance": 94.0,
        "addressLine1": "Flat 204, Radha Krishna Complex, Main Road",
        "addressLine2": "Near Shivaji Statue",
        "villageCity": "Ichalkaranji",
        "taluka": "Hatkanangle",
        "district": "Kolhapur",
        "state": "Maharashtra",
        "pinCode": "416115",
        "country": "India"
    }
    status, res = make_request("/api/v1/students", method="POST", data=student_payload, token=admin_token)
    print(f"Status: {status}")
    if status in (200, 201):
        created_student = res
        print("✓ Student registered successfully with valid Indian PIN code 416115!")
        print(f"  Saved Address: {created_student.get('villageCity')}, {created_student.get('district')} - {created_student.get('pinCode')}")
    else:
        print(f"FAILED to add student: {res}")
        sys.exit(1)

    # 3. Test 2: Invalid PIN codes are rejected
    print("\n[Test 2] Testing rejection of invalid PIN codes...")
    invalid_pins = [
        "012345",   # starts with 0
        "12345",    # 5 digits
        "1234567",  # 7 digits
        "ABC123",   # alphanumeric
        "416 15",   # contains space
    ]
    for pin in invalid_pins:
        bad_payload = dict(student_payload)
        bad_payload["prn"] = f"PRN{pin}"
        bad_payload["rollNo"] = f"ROLL{pin}"
        bad_payload["email"] = f"badpin_{pin}@sitcoe.org.in"
        bad_payload["pinCode"] = pin

        status, res = make_request("/api/v1/students", method="POST", data=bad_payload, token=admin_token)
        if status in (400, 422, 500):
            print(f"✓ Rejected invalid PIN '{pin}': status={status}")
        else:
            print(f"❌ ERROR: Invalid PIN '{pin}' was unexpectedly accepted! status={status}")
            sys.exit(1)

    # 4. Test 3: Required address fields cannot be submitted empty
    print("\n[Test 3] Testing rejection when required address fields are missing or empty...")
    required_fields = ["addressLine1", "villageCity", "taluka", "district", "state", "pinCode", "country"]
    for field in required_fields:
        missing_payload = dict(student_payload)
        missing_payload["prn"] = f"PRN_MISS_{field}"
        missing_payload["rollNo"] = f"ROLL_{field}"
        missing_payload["email"] = f"miss_{field.lower()}@sitcoe.org.in"
        missing_payload[field] = ""  # empty

        status, res = make_request("/api/v1/students", method="POST", data=missing_payload, token=admin_token)
        if status in (400, 422, 500):
            print(f"✓ Rejected empty required field '{field}': status={status}")
        else:
            print(f"❌ ERROR: Empty required field '{field}' was unexpectedly accepted! status={status}")
            sys.exit(1)

    # 5. Test 4: Address data is correctly persisted in PostgreSQL
    print("\n[Test 4] Verifying address persistence in database...")
    student_id = created_student["id"]
    status, fetched = make_request(f"/api/v1/students/{student_id}", method="GET", token=admin_token)
    assert status == 200, f"Failed to fetch student by ID: {status}"
    assert fetched.get("addressLine1") == "Flat 204, Radha Krishna Complex, Main Road", "addressLine1 mismatch"
    assert fetched.get("addressLine2") == "Near Shivaji Statue", "addressLine2 mismatch"
    assert fetched.get("villageCity") == "Ichalkaranji", "villageCity mismatch"
    assert fetched.get("taluka") == "Hatkanangle", "taluka mismatch"
    assert fetched.get("district") == "Kolhapur", "district mismatch"
    assert fetched.get("state") == "Maharashtra", "state mismatch"
    assert fetched.get("pinCode") == "416115", "pinCode mismatch"
    assert fetched.get("country") == "India", "country mismatch"
    print("✓ All 8 address columns are verified to be correctly persisted in the database!")

    # 6. Test 5: A student can view and update their own address
    print("\n[Test 5] Student self-service address update (PUT /api/v1/students/me/address)...")
    # Register/ensure user account for student to test JWT auth
    user_reg_status, user_reg = make_request("/api/v1/auth/register", method="POST", data={
        "name": "Prathamesh Patil",
        "email": "prathamesh.patil@sitcoe.org.in",
        "password": "StudentPass@123",
        "role": "student"
    })
    if user_reg_status == 200:
        student_token = user_reg["token"]
    else:
        # User may already exist, login
        _, login_res = make_request("/api/v1/auth/login", method="POST", data={
            "email": "prathamesh.patil@sitcoe.org.in",
            "password": "StudentPass@123"
        })
        student_token = login_res["token"]

    updated_address = {
        "addressLine1": "Bunglow No. 5, Rajarampuri 3rd Lane",
        "addressLine2": "Opposite Syndicate Bank",
        "villageCity": "Kolhapur",
        "taluka": "Karveer",
        "district": "Kolhapur",
        "state": "Maharashtra",
        "pinCode": "416008",
        "country": "India"
    }
    status, update_res = make_request("/api/v1/students/me/address", method="PUT", data=updated_address, token=student_token)
    print(f"Self-service update status: {status}")
    if status == 200:
        print("✓ Student updated own address successfully via /api/v1/students/me/address!")
        print(f"  New PIN: {update_res.get('pinCode')}, City: {update_res.get('villageCity')}")
    else:
        print(f"❌ Student update failed: {update_res}")
        sys.exit(1)

    # 7. Test 6: Unauthorized access & privacy protection
    print("\n[Test 6] Verifying privacy protection & unauthorized access restriction...")
    # Unauthenticated GET request to students roster
    status, public_roster = make_request("/api/v1/students", method="GET")
    if status == 200 and isinstance(public_roster, list):
        target = next((s for s in public_roster if s.get("id") == student_id), None)
        if target:
            # Address fields MUST be masked (null) for unauthenticated caller
            assert target.get("addressLine1") is None, f"Address line 1 leaked: {target.get('addressLine1')}"
            assert target.get("pinCode") is None, f"PIN code leaked: {target.get('pinCode')}"
            assert target.get("villageCity") is None, f"City leaked: {target.get('villageCity')}"
            print("✓ Unauthenticated callers receive masked/null address fields. No leak in public roster.")

    # Create another student account
    other_email = "other.student@sitcoe.org.in"
    reg_status, other_reg = make_request("/api/v1/auth/register", method="POST", data={
        "name": "Other Student",
        "email": other_email,
        "password": "OtherPass@123",
        "role": "student"
    })
    if reg_status == 200:
        other_token = other_reg["token"]
    else:
        _, login_res = make_request("/api/v1/auth/login", method="POST", data={
            "email": other_email,
            "password": "OtherPass@123"
        })
        other_token = login_res["token"]

    # Student 2 tries to maliciously modify Student 1's address via /api/v1/students/{id}/address
    status, hack_res = make_request(f"/api/v1/students/{student_id}/address", method="PUT", data=updated_address, token=other_token)
    if status in (401, 403):
        print(f"✓ Other student was blocked with status={status} from modifying someone else's address.")
    else:
        print(f"❌ SECURITY FAILED: Other student was able to modify address! status={status}, res={hack_res}")
        sys.exit(1)

    print("\n==================================================")
    print("ALL 6 VERIFICATION REQUIREMENTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
