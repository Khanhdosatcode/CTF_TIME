from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_required, current_user
from app import db
from emails.forms import ComposeForm
from models import Email, User
from utils import save_uploaded_file, render_email_template, urlencode
from markupsafe import escape

emails_bp = Blueprint('emails', __name__)

@emails_bp.route('/inbox')
@login_required
def inbox():
    received_emails = Email.query.filter_by(recipient_id=current_user.id).order_by(Email.timestamp.desc()).all()
    return render_template('emails/inbox.html', emails=received_emails)

@emails_bp.route('/compose', methods=['GET', 'POST'])
@login_required
def compose():
    form = ComposeForm()
    form.recipient.choices = [(user.id, user.username) for user in User.query.filter(User.id != current_user.id).all()]
    
    if form.validate_on_submit():
        attachment_path = None
        if form.attachment.data:
            attachment_path = save_uploaded_file(form.attachment.data)
            if not attachment_path:
                flash('Invalid file type. Allowed types are: jpg, jpeg, png, gif, bmp, webp', 'danger')
                return redirect(url_for('emails.compose'))
        
        rendered_body = render_email_template(form.body.data)

        if not rendered_body:
            flash('There was an error processing your message', 'danger')
            return redirect(url_for('emails.compose'))
        
        email = Email(
            subject=form.subject.data,
            body=escape(rendered_body),
            attachment_path=attachment_path,
            sender_id=current_user.id,
            recipient_id=form.recipient.data
        )
        db.session.add(email)
        db.session.commit()
        flash('Your email has been sent!', 'success')
        return redirect(url_for('emails.inbox'))
    
    return render_template('emails/compose.html', form=form)

@emails_bp.route('/email/<int:email_id>')
@login_required
def view_email(email_id):
    email = Email.query.get_or_404(email_id)
    if email.recipient_id != current_user.id and email.sender_id != current_user.id:
        abort(403)
    if email.recipient_id == current_user.id and not email.is_read:
        email.is_read = True
        db.session.commit()
    return render_template('emails/view.html', email=email)