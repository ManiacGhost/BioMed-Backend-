// Newsletter model - defines the structure of newsletter subscriber data

class NewsletterSubscriber {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.status = data.status;
    this.created_at = data.created_at;
  }
}

module.exports = NewsletterSubscriber;
