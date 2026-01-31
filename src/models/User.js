class User {
  constructor(data) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.title = data.title;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.profile_image_url = data.profile_image_url;
    this.biography = data.biography;
    this.linkedin_url = data.linkedin_url;
    this.github_url = data.github_url;
    this.role = data.role;
    this.is_instructor = data.is_instructor;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  isAdmin() {
    return this.role === 'ADMIN';
  }

  isInstructor() {
    return this.role === 'INSTRUCTOR' || this.is_instructor;
  }

  isActive() {
    return this.status === 'ACTIVE';
  }
}

module.exports = User;
