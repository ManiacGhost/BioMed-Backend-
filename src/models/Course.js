// Course model - defines the structure of course data

class Course {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.short_description = data.short_description;
    this.description = data.description;
    this.outcomes = data.outcomes;
    this.faqs = data.faqs;
    this.language = data.language;
    this.category_id = data.category_id;
    this.sub_category_id = data.sub_category_id;
    this.section = data.section;
    this.requirements = data.requirements;
    this.price = data.price;
    this.discount_flag = data.discount_flag;
    this.discounted_price = data.discounted_price;
    this.level = data.level;
    this.user_id = data.user_id;
    this.thumbnail = data.thumbnail;
    this.video_url = data.video_url;
    this.date_added = data.date_added;
    this.last_modified = data.last_modified;
    this.course_type = data.course_type;
    this.is_top_course = data.is_top_course;
    this.is_admin = data.is_admin;
    this.status = data.status;
    this.course_overview_provider = data.course_overview_provider;
    this.meta_keywords = data.meta_keywords;
    this.meta_description = data.meta_description;
    this.is_free_course = data.is_free_course;
    this.multi_instructor = data.multi_instructor;
    this.enable_drip_content = data.enable_drip_content;
    this.creator = data.creator;
    this.expiry_period = data.expiry_period;
    this.upcoming_image_thumbnail = data.upcoming_image_thumbnail;
    this.publish_date = data.publish_date;
  }
}

module.exports = Course;
