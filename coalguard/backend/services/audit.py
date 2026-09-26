from sqlalchemy.orm import Session
from models import AuditLog

def log_action(db: Session, entity_type: str, entity_id: str, actor_id: str, action: str, before: dict = None, after: dict = None):
    audit_entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        action=action,
        before_json=before,
        after_json=after
    )
    db.add(audit_entry)
