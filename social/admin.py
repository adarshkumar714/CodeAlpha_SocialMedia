from django.contrib import admin

from .models import (
    Profile,
    Post,
    Comment,
    Like,
    Follow,
    SavedPost,
    PostShare,
    Notification,
    Story,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user",)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    search_fields = ("content", "user__username")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "created_at")


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created_at")


@admin.register(PostShare)
class PostShareAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created_at")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "recipient",
        "sender",
        "notification_type",
        "is_read",
        "created_at",
    )


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")