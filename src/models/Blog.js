// Blog model - defines the structure of blog data

class Blog {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.category_id = data.category_id;
    this.author_id = data.author_id;
    this.keywords = data.keywords;
    this.content = data.content;
    this.thumbnail_url = data.thumbnail_url;
    this.banner_url = data.banner_url;
    this.is_popular = data.is_popular;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.short_description = data.short_description;
    this.reading_time = data.reading_time;
    this.image_alt_text = data.image_alt_text;
    this.image_caption = data.image_caption;
    this.publish_date = data.publish_date;
    this.visibility = data.visibility;
    this.seo_title = data.seo_title;
    this.seo_description = data.seo_description;
    this.focus_keyword = data.focus_keyword;
    this.canonical_url = data.canonical_url;
    this.meta_robots = data.meta_robots;
    this.allow_comments = data.allow_comments;
    this.show_on_homepage = data.show_on_homepage;
    this.is_sticky = data.is_sticky;
    this.author_name = data.author_name;
    this.author_email = data.author_email;
  }
}

module.exports = Blog;
