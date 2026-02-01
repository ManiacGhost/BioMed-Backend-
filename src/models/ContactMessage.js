// ContactMessage model - defines the structure of contact message data

class ContactMessage {
  constructor(data) {
    this.id = data.id;
    this.full_name = data.full_name;
    this.email = data.email;
    this.country_code = data.country_code;
    this.phone_number = data.phone_number;
    this.interest_topic = data.interest_topic;
    this.message = data.message;
    this.agreed_to_terms = data.agreed_to_terms;
    this.created_at = data.created_at;
    this.status = data.status;
  }
}

module.exports = ContactMessage;
