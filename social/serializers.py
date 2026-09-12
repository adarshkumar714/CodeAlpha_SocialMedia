from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Profile,
    Post,
    Comment,
    Story,
    Notification,
)


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "followers_count",
            "following_count",
            "posts_count",
            "profile_picture",
            "is_following",
        ]

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_posts_count(self, obj):
        return obj.posts.count()

    def get_profile_picture(self, obj):
        try:
            if obj.profile.profile_picture:
                request = self.context.get("request")

                if request:
                    return request.build_absolute_uri(
                        obj.profile.profile_picture.url
                    )

                return obj.profile.profile_picture.url

        except Profile.DoesNotExist:
            pass

        return None

    def get_is_following(self, obj):
        request = self.context.get("request")

        if not request:
            return False

        if not request.user.is_authenticated:
            return False

        if request.user.id == obj.id:
            return False

        return obj.followers.filter(
            follower=request.user
        ).exists()


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "bio",
            "profile_picture",
        ]


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "user",
            "content",
            "created_at",
        ]


class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    comments = CommentSerializer(
        many=True,
        read_only=True
    )

    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()

    liked_by_me = serializers.SerializerMethodField()
    saved_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "user",
            "content",
            "image",
            "video",
            "created_at",
            "likes_count",
            "comments_count",
            "shares_count",
            "liked_by_me",
            "saved_by_me",
            "comments",
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_shares_count(self, obj):
        return obj.shares.count()

    def get_liked_by_me(self, obj):
        request = self.context.get("request")

        return bool(
            request
            and request.user.is_authenticated
            and obj.likes.filter(
                user=request.user
            ).exists()
        )

    def get_saved_by_me(self, obj):
        request = self.context.get("request")

        return bool(
            request
            and request.user.is_authenticated
            and obj.saved_by.filter(
                user=request.user
            ).exists()
        )


class StorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    media_type = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            "id",
            "user",
            "image",
            "video",
            "post",
            "media_type",
            "created_at",
        ]

    def get_media_type(self, obj):
        if obj.video:
            return "video"

        return "image"


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "sender",
            "notification_type",
            "post",
            "message",
            "is_read",
            "created_at",
        ]