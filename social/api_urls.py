from django.urls import path

from .views_api import (
    register_api,
    login_api,
    current_user_api,
    profile_api,
    users_api,
    user_profile_api,
    follow_user_api,
    posts_api,
    delete_post_api,
    like_post_api,
    comment_post_api,
    save_post_api,
    share_post_to_story_api,
    notifications_api,
    read_notifications_api,
    stories_api,
)


urlpatterns = [
    path("register/", register_api),
    path("login/", login_api),

    path("me/", current_user_api),

    path("profile/", profile_api),

    path("users/", users_api),
    path("users/<int:user_id>/", user_profile_api),
    path("users/<int:user_id>/follow/", follow_user_api),

    path("posts/", posts_api),
    path("posts/<int:post_id>/delete/", delete_post_api),
    path("posts/<int:post_id>/like/", like_post_api),
    path("posts/<int:post_id>/comment/", comment_post_api),
    path("posts/<int:post_id>/save/", save_post_api),
    path("posts/<int:post_id>/share-story/", share_post_to_story_api),

    path("stories/", stories_api),

    path("notifications/", notifications_api),
    path("notifications/read/", read_notifications_api),
]