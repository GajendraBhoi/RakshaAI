import sys
import os
from passlib.hash import sha256_crypt
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import engine, Base, SessionLocal
from models import Role, Mine, User, ComplianceRequirement, Inspection, Observation, CorrectiveAction, RiskScore

def hash_password(password: str) -> str:
    return sha256_crypt.hash(password)

def seed_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # ROLES
        role_insp = Role(id="r-inspector", name="Inspector")
        role_mgr = Role(id="r-manager", name="Mine Manager")
        role_corp = Role(id="r-corporate", name="Corporate Manager")
        db.add_all([role_insp, role_mgr, role_corp])
        
        # MINES
        # Mine C is Critical (Deterministic ID)
        mine_c = Mine(id="c0000000-0000-0000-0000-000000000000", name="Jharia Opencast (Critical)", latitude=23.75, longitude=86.42)
        mine_a = Mine(id="a0000000-0000-0000-0000-000000000000", name="Korba East (Low)", latitude=22.35, longitude=82.68)
        mine_b = Mine(id="b0000000-0000-0000-0000-000000000000", name="Singrauli (Med)", latitude=24.20, longitude=82.66)
        db.add_all([mine_c, mine_a, mine_b])
        
        # USERS
        pwd = hash_password("demo123")
        u_insp_c = User(id="u-insp-c", email="inspector.c@demo.com", name="Insp C", password_hash=pwd, role_id=role_insp.id, mine_id=mine_c.id)
        u_mgr_c = User(id="u-mgr-c", email="manager.c@demo.com", name="Manager C", password_hash=pwd, role_id=role_mgr.id, mine_id=mine_c.id)
        
        u_insp_a = User(id="u-insp-a", email="inspector.a@demo.com", name="Insp A", password_hash=pwd, role_id=role_insp.id, mine_id=mine_a.id)
        u_mgr_a = User(id="u-mgr-a", email="manager.a@demo.com", name="Manager A", password_hash=pwd, role_id=role_mgr.id, mine_id=mine_a.id)
        
        u_corp = User(id="u-corp", email="corporate@demo.com", name="Corp Manager", password_hash=pwd, role_id=role_corp.id, mine_id=None)
        db.add_all([u_insp_c, u_mgr_c, u_insp_a, u_mgr_a, u_corp])
        
        db.commit()
        
        # ADD COMPLIANCE & OBSERVATIONS FOR MINE C
        today = datetime.utcnow()
        cr1 = ComplianceRequirement(id="cr1-c", title="Monthly Air Quality", mine_id=mine_c.id, due_date=today - timedelta(days=5), status="overdue")
        cr2 = ComplianceRequirement(id="cr2-c", title="Daily Water Discharge", mine_id=mine_c.id, due_date=today + timedelta(days=2), status="compliant")
        
        insp1 = Inspection(id="insp1-c", temp_uuid="temp1", mine_id=mine_c.id, inspector_id=u_insp_c.id, gps_lat=23.75, gps_lon=86.42)
        obs1 = Observation(id="obs1-c", inspection_id=insp1.id, severity="High", description="Dust suppression system offline.", photo_url="/fake/dust.jpg")
        ca1 = CorrectiveAction(id="ca1-c", observation_id=obs1.id, owner_id=u_insp_c.id, status="OPEN", due_date=today - timedelta(days=16))
        
        db.add_all([cr1, cr2, insp1, obs1, ca1])
        
        # Risk Score for C
        rs_c = RiskScore(id="rs-c", mine_id=mine_c.id, score=88, reasons_json=["45% compliance", "5 overdue actions"])
        rs_a = RiskScore(id="rs-a", mine_id=mine_a.id, score=12, reasons_json=["95% compliance"])
        rs_b = RiskScore(id="rs-b", mine_id=mine_b.id, score=45, reasons_json=["80% compliance", "2 actions due tomorrow"])
        db.add_all([rs_c, rs_a, rs_b])
        
        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
