from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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

from .serializers import (
    UserSerializer,
    ProfileSerializer,
    PostSerializer,
    StorySerializer,
    NotificationSerializer,
)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def ensure_profile(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def notify(recipient, sender, notification_type, message, post=None):
    if recipient == sender:
        return

    Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        message=message,
        post=post,
    )


def auth_response(user):
    ensure_profile(user)
    token, _ = Token.objects.get_or_create(user=user)

    return {
        "token": token.key,
        "user": UserSerializer(
            user,
            context={"request": None}
        ).data,
    }


# ---------------------------------------------------------
# AUTH
# ---------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(username) < 3:
        return Response(
            {"error": "Username must contain at least 3 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 6:
        return Response(
            {"error": "Password must contain at least 6 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email and User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )

    ensure_profile(user)

    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            "token": token.key,
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    user = authenticate(
        username=username,
        password=password,
    )

    if not user:
        return Response(
            {"error": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    ensure_profile(user)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "user": UserSerializer(user).data,
    })


# ---------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def current_user_api(request):
    ensure_profile(request.user)

    return Response(
        UserSerializer(
            request.user,
            context={"request": request}
        ).data
    )


# ---------------------------------------------------------
# PROFILE
# ---------------------------------------------------------

@csrf_exempt
@api_view(["GET", "PUT", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def profile_api(request):

    profile = ensure_profile(request.user)

    if request.method == "GET":
        return Response(
            ProfileSerializer(
                profile,
                context={"request": request}
            ).data
        )

    if "bio" in request.data:
        profile.bio = request.data.get("bio", "")

    if "profile_picture" in request.FILES:
        profile.profile_picture = request.FILES["profile_picture"]

    profile.save()

    return Response(
        ProfileSerializer(
            profile,
            context={"request": request}
        ).data
    )


# ---------------------------------------------------------
# USERS / SEARCH
# ---------------------------------------------------------

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def users_api(request):

    query = request.GET.get("search", "").strip()

    users = User.objects.exclude(
        id=request.user.id
    )

    if query:
        users = users.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query)
        )

    users = users.order_by("username")[:30]

    return Response(
        UserSerializer(
            users,
            many=True,
            context={"request": request}
        ).data
    )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile_api(request, user_id):

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    ensure_profile(user)

    is_following = Follow.objects.filter(
        follower=request.user,
        following=user
    ).exists()

    data = UserSerializer(
        user,
        context={"request": request}
    ).data

    data["is_following"] = is_following

    data["bio"] = user.profile.bio

    return Response(data)


# ---------------------------------------------------------
# FOLLOW
# ---------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def follow_user_api(request, user_id):

    if request.user.id == user_id:
        return Response(
            {"error": "You cannot follow yourself."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    follow = Follow.objects.filter(
        follower=request.user,
        following=target
    ).first()

    if follow:
        follow.delete()
        following = False
    else:
        Follow.objects.create(
            follower=request.user,
            following=target
        )

        notify(
            target,
            request.user,
            "follow",
            f"@{request.user.username} started following you."
        )

        following = True

    return Response({
        "following": following,
        "followers_count": target.followers.count(),
    })


# ---------------------------------------------------------
# POSTS
# ---------------------------------------------------------

@csrf_exempt
@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def posts_api(request):

    if request.method == "GET":

        posts = Post.objects.select_related(
            "user"
        ).prefetch_related(
            "likes",
            "comments",
            "shares",
            "saved_by",
        )

        serializer = PostSerializer(
            posts,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)

    content = request.data.get("content", "").strip()
    image = request.FILES.get("image")
    video = request.FILES.get("video")

    if not content and not image and not video:
        return Response(
            {"error": "Add text, image, or video."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if image and video:
        return Response(
            {"error": "Choose either image or video."},
            status=status.HTTP_400_BAD_REQUEST
        )

    post = Post.objects.create(
        user=request.user,
        content=content,
        image=image,
        video=video,
    )

    return Response(
        PostSerializer(
            post,
            context={"request": request}
        ).data,
        status=status.HTTP_201_CREATED
    )


@csrf_exempt
@api_view(["DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_post_api(request, post_id):

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if post.user != request.user:
        return Response(
            {"error": "You can delete only your own posts."},
            status=status.HTTP_403_FORBIDDEN
        )

    post.delete()

    return Response({
        "message": "Post deleted successfully."
    })


# ---------------------------------------------------------
# LIKE
# ---------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def like_post_api(request, post_id):

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    like = Like.objects.filter(
        post=post,
        user=request.user
    ).first()

    if like:
        like.delete()
        liked = False
    else:
        Like.objects.create(
            post=post,
            user=request.user
        )

        notify(
            post.user,
            request.user,
            "like",
            f"@{request.user.username} liked your post.",
            post
        )

        liked = True

    return Response({
        "liked": liked,
        "likes_count": post.likes.count()
    })


# ---------------------------------------------------------
# COMMENT
# ---------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def comment_post_api(request, post_id):

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    content = request.data.get("content", "").strip()

    if not content:
        return Response(
            {"error": "Comment cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST
        )

    comment = Comment.objects.create(
        post=post,
        user=request.user,
        content=content,
    )

    notify(
        post.user,
        request.user,
        "comment",
        f"@{request.user.username} commented on your post.",
        post
    )

    return Response({
        "id": comment.id,
        "content": comment.content,
        "username": request.user.username,
        "created_at": comment.created_at,
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def save_post_api(request, post_id):

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    saved = SavedPost.objects.filter(
        user=request.user,
        post=post
    ).first()

    if saved:
        saved.delete()
        is_saved = False
    else:
        SavedPost.objects.create(
            user=request.user,
            post=post
        )
        is_saved = True

    return Response({
        "saved": is_saved
    })


# ---------------------------------------------------------
# SHARE TO STORY
# ---------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def share_post_to_story_api(request, post_id):

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    Story.objects.create(
        user=request.user,
        post=post
    )

    PostShare.objects.create(
        user=request.user,
        post=post
    )

    notify(
        post.user,
        request.user,
        "share",
        f"@{request.user.username} shared your post to their story.",
        post
    )

    return Response({
        "message": "Post shared to your story.",
        "shares_count": post.shares.count(),
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------
# STORIES
# ---------------------------------------------------------

@csrf_exempt
@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def stories_api(request):

    if request.method == "GET":

        cutoff = timezone.now() - timezone.timedelta(hours=24)

        stories = Story.objects.filter(
            created_at__gte=cutoff
        ).select_related(
            "user",
            "post",
            "post__user"
        )

        return Response(
            StorySerializer(
                stories,
                many=True,
                context={"request": request}
            ).data
        )

    image = request.FILES.get("image")
    video = request.FILES.get("video")
    post_id = request.data.get("post_id")

    if not image and not video and not post_id:
        return Response(
            {"error": "Story needs image, video, or shared post."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if image and video:
        return Response(
            {"error": "Choose image or video."},
            status=status.HTTP_400_BAD_REQUEST
        )

    post = None

    if post_id:
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    story = Story.objects.create(
        user=request.user,
        image=image,
        video=video,
        post=post,
    )

    return Response(
        StorySerializer(
            story,
            context={"request": request}
        ).data,
        status=status.HTTP_201_CREATED
    )


# ---------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def notifications_api(request):

    notifications = Notification.objects.filter(
        recipient=request.user
    )[:50]

    return Response(
        NotificationSerializer(
            notifications,
            many=True,
            context={"request": request}
        ).data
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def read_notifications_api(request):

    Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(
        is_read=True
    )

    return Response({
        "message": "Notifications marked as read."
    })