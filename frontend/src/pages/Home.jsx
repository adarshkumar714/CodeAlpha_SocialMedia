import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Home as HomeIcon,
  Search,
  Bell,
  User,
  Heart,
  MessageCircle,
  Bookmark,
  Plus,
  Image as ImageIcon,
  Video,
  Send,
  Trash2,
  X,
  UserPlus,
  UserCheck,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";

import api from "../services/api";

import "./Home.css";


const API_ROOT = "http://127.0.0.1:8000";


function Home({
  onLogout,
  theme,
  onToggleTheme,
}) {

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  const [search, setSearch] = useState("");
  const [active, setActive] = useState("home");

  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const [showProfile, setShowProfile] =
    useState(false);

  const [caption, setCaption] = useState("");

  const [postFile, setPostFile] = useState(null);
  const [storyFile, setStoryFile] = useState(null);

  const [comments, setComments] = useState({});

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [storyViewer, setStoryViewer] =
    useState(null);


  const currentUserId =
    Number(localStorage.getItem("userId"));


  const currentUsername =
    localStorage.getItem("username") || "user";


  const imageUrl = (path) => {

    if (!path) {
      return null;
    }

    if (
      typeof path === "string" &&
      path.startsWith("http")
    ) {
      return path;
    }

    return `${API_ROOT}${path}`;
  };


  const getInitial = (username) => {

    if (!username) {
      return "?";
    }

    return username
      .charAt(0)
      .toUpperCase();
  };


  const formatDate = (date) => {

    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString(
      [],
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  useEffect(() => {
    loadAll();
  }, []);


  useEffect(() => {

    const timer = setTimeout(() => {
      loadUsers(search);
    }, 350);

    return () => {
      clearTimeout(timer);
    };

  }, [search]);


  const loadAll = async () => {

    await Promise.all([
      loadCurrentUser(),
      loadPosts(),
      loadUsers(""),
      loadStories(),
      loadNotifications(),
    ]);
  };


  const loadCurrentUser = async () => {

    try {

      const res =
        await api.get("me/");

      setCurrentUser(res.data);

      if (res.data?.id) {
        localStorage.setItem(
          "userId",
          res.data.id
        );
      }

      if (res.data?.username) {
        localStorage.setItem(
          "username",
          res.data.username
        );
      }

    } catch (err) {

      console.error(
        "Current user error:",
        err
      );
    }
  };


  const loadPosts = async () => {

    try {

      const res =
        await api.get("posts/");

      setPosts(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Posts error:",
        err
      );

    } finally {

      setLoading(false);
    }
  };


  const loadUsers = async (value) => {

    try {

      const res =
        await api.get(
          `users/?search=${encodeURIComponent(value)}`
        );

      setUsers(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Users error:",
        err
      );
    }
  };


  const loadStories = async () => {

    try {

      const res =
        await api.get("stories/");

      setStories(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Stories error:",
        err
      );
    }
  };


  const loadNotifications = async () => {

    try {

      const res =
        await api.get("notifications/");

      setNotifications(
        res.data?.notifications || []
      );

    } catch (err) {

      console.error(
        "Notifications error:",
        err
      );
    }
  };


  const handleLike = async (id) => {

    try {

      const res =
        await api.post(
          `posts/${id}/like/`
        );

      setPosts((old) =>
        old.map((post) =>
          post.id === id
            ? {
                ...post,
                liked_by_me:
                  res.data.liked,
                likes_count:
                  res.data.likes_count,
              }
            : post
        )
      );

      await loadNotifications();

    } catch (err) {

      console.error(
        "Like error:",
        err
      );
    }
  };


  const handleSave = async (id) => {

    try {

      const res =
        await api.post(
          `posts/${id}/save/`
        );

      setPosts((old) =>
        old.map((post) =>
          post.id === id
            ? {
                ...post,
                saved_by_me:
                  res.data.saved,
              }
            : post
        )
      );

    } catch (err) {

      console.error(
        "Save error:",
        err
      );
    }
  };


  const handleComment = async (id) => {

    const text =
      comments[id]?.trim();

    if (!text) {
      return;
    }

    try {

      const res =
        await api.post(
          `posts/${id}/comment/`,
          {
            content: text,
          }
        );

      setPosts((old) =>
        old.map((post) =>
          post.id === id
            ? {
                ...post,
                comments: [
                  ...(post.comments || []),
                  res.data,
                ],
                comments_count:
                  (post.comments_count || 0) + 1,
              }
            : post
        )
      );

      setComments((old) => ({
        ...old,
        [id]: "",
      }));

      await loadNotifications();

    } catch (err) {

      console.error(
        "Comment error:",
        err
      );
    }
  };


  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        "Delete this post?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `posts/${id}/delete/`
      );

      setPosts((old) =>
        old.filter(
          (post) => post.id !== id
        )
      );

      await loadCurrentUser();

    } catch (err) {

      console.error(
        "Delete error:",
        err
      );
    }
  };


  const handleFollow = async (id) => {

    try {

      const res =
        await api.post(
          `users/${id}/follow/`
        );

      setUsers((old) =>
        old.map((user) =>
          user.id === id
            ? {
                ...user,
                is_following:
                  res.data.following,
                followers_count:
                  res.data.followers_count,
              }
            : user
        )
      );

      await loadCurrentUser();
      await loadNotifications();

    } catch (err) {

      console.error(
        "Follow error:",
        err
      );
    }
  };


  const createPost = async () => {

    if (
      !caption.trim() &&
      !postFile
    ) {
      return;
    }

    setPosting(true);

    try {

      const formData =
        new FormData();

      formData.append(
        "content",
        caption
      );

      if (postFile) {

        if (
          postFile.type.startsWith(
            "video/"
          )
        ) {

          formData.append(
            "video",
            postFile
          );

        } else {

          formData.append(
            "image",
            postFile
          );

        }
      }

      const res =
        await api.post(
          "posts/",
          formData
        );

      setPosts((old) => [
        res.data,
        ...old,
      ]);

      setCaption("");
      setPostFile(null);
      setShowCreate(false);

      await loadCurrentUser();

    } catch (err) {

      console.error(
        "Post upload error:",
        err
      );

      alert(
        err.response?.data?.error ||
        "Post upload failed."
      );

    } finally {

      setPosting(false);
    }
  };


  const createStory = async () => {

    if (!storyFile) {
      return;
    }

    try {

      const formData =
        new FormData();

      if (
        storyFile.type.startsWith(
          "video/"
        )
      ) {

        formData.append(
          "video",
          storyFile
        );

      } else {

        formData.append(
          "image",
          storyFile
        );
      }

      const res =
        await api.post(
          "stories/",
          formData
        );

      setStories((old) => [
        res.data,
        ...old,
      ]);

      setStoryFile(null);

    } catch (err) {

      console.error(
        "Story upload error:",
        err
      );

      alert(
        err.response?.data?.error ||
        "Story upload failed."
      );
    }
  };


  const handleShareToStory = async (
    postId
  ) => {

    try {

      const res =
        await api.post(
          `posts/${postId}/share-story/`
        );

      if (res.data) {

        setStories((old) => [
          res.data,
          ...old,
        ]);
      }

      await loadNotifications();

      alert(
        "Post shared to your story."
      );

    } catch (err) {

      console.error(
        "Share story error:",
        err
      );

      alert(
        err.response?.data?.error ||
        "Could not share post to story."
      );
    }
  };


  const readNotifications = async () => {

    try {

      await api.post(
        "notifications/read/"
      );

      setNotifications((old) =>
        old.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

    } catch (err) {

      console.error(
        "Notification read error:",
        err
      );
    }
  };


  const openNotifications = () => {

    setShowNotifications(true);

    readNotifications();
  };


  const myPosts = useMemo(() => {

    return posts.filter(
      (post) =>
        post.user?.id === currentUserId
    );

  }, [posts, currentUserId]);


  const activeStory =
    storyViewer !== null
      ? stories[storyViewer]
      : null;


  const nextStory = () => {

    if (!stories.length) {
      return;
    }

    setStoryViewer((current) => {

      if (current === null) {
        return 0;
      }

      if (
        current >=
        stories.length - 1
      ) {
        return 0;
      }

      return current + 1;
    });
  };


  const previousStory = () => {

    if (!stories.length) {
      return;
    }

    setStoryViewer((current) => {

      if (current === null) {
        return 0;
      }

      if (current <= 0) {
        return stories.length - 1;
      }

      return current - 1;
    });
  };


  return (
    <div className="social-app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            <Sparkles size={21} />
          </div>

          <span>
            Connectly
          </span>

        </div>


        <nav>

          <button
            className={
              active === "home"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {

              setActive("home");

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });

            }}
          >

            <HomeIcon />

            <span>
              Home
            </span>

          </button>


          <button
            className="nav-item"
            onClick={() => {

              setActive("search");

              document
                .querySelector(
                  ".search-input"
                )
                ?.focus();

            }}
          >

            <Search />

            <span>
              Search
            </span>

          </button>


          <button
            className="nav-item"
            onClick={
              openNotifications
            }
          >

            <Bell />

            <span>
              Notifications
            </span>

            {notifications.some(
              (n) => !n.is_read
            ) && (
              <i className="notification-dot" />
            )}

          </button>


          <button
            className="nav-item"
            onClick={() =>
              setShowProfile(true)
            }
          >

            <User />

            <span>
              Profile
            </span>

          </button>


          <button
            className="nav-item"
            onClick={() =>
              setShowCreate(true)
            }
          >

            <Plus />

            <span>
              Create
            </span>

          </button>

        </nav>


        <div className="sidebar-bottom">

          <button
            className="theme-button"
            onClick={onToggleTheme}
          >

            {theme === "dark"
              ? "☀️"
              : "🌙"}

            <span>
              {theme === "dark"
                ? "Light mode"
                : "Dark mode"}
            </span>

          </button>


          <button
            className="logout-button"
            onClick={onLogout}
          >

            <LogOut />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* MAIN FEED */}

      <main className="feed">

        <header className="mobile-header">

          <div className="brand">

            <div className="brand-mark">
              <Sparkles size={19} />
            </div>

            <span>
              Connectly
            </span>

          </div>


          <div className="mobile-header-actions">

            <button
              className="mobile-theme-button"
              onClick={onToggleTheme}
            >
              {theme === "dark"
                ? "☀️"
                : "🌙"}
            </button>


            <button
              className="mobile-bell"
              onClick={
                openNotifications
              }
            >

              <Bell size={21} />

            </button>

          </div>

        </header>


        {/* STORIES */}

        <section className="stories-card">

          <div className="stories-header">

            <div>

              <h2>
                Stories
              </h2>

              <p>
                Share a moment with your followers
              </p>

            </div>

          </div>


          <div className="stories-scroll">

            <label className="story">

              <div className="story-ring add-story">

                {currentUser?.profile_picture ? (

                  <img
                    src={imageUrl(
                      currentUser.profile_picture
                    )}
                    alt=""
                  />

                ) : (

                  <div className="story-fallback">

                    {getInitial(
                      currentUsername
                    )}

                  </div>

                )}

                <span className="story-plus">

                  <Plus size={15} />

                </span>

              </div>


              <span className="story-name">
                Your story
              </span>


              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(e) => {

                  setStoryFile(
                    e.target.files?.[0] ||
                    null
                  );

                }}
              />

            </label>


            {stories.map(
              (story, index) => (

                <button
                  className="story"
                  key={story.id}
                  onClick={() =>
                    setStoryViewer(index)
                  }
                >

                  <div className="story-ring">

                    {story.user
                      ?.profile_picture ? (

                      <img
                        src={imageUrl(
                          story.user
                            .profile_picture
                        )}
                        alt=""
                      />

                    ) : (

                      <div className="story-fallback">

                        {getInitial(
                          story.user
                            ?.username
                        )}

                      </div>

                    )}


                    {story.media_type ===
                      "video" && (

                      <span className="story-video-badge">

                        <Video size={12} />

                      </span>

                    )}

                  </div>


                  <span className="story-name">

                    {story.user?.username}

                  </span>

                </button>

              )
            )}

          </div>


          {storyFile && (

            <div className="story-selected">

              <div>

                <strong>
                  Ready to share
                </strong>

                <small>
                  {storyFile.name}
                </small>

              </div>


              <div className="story-selected-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setStoryFile(null)
                  }
                >
                  Cancel
                </button>


                <button
                  className="primary-button"
                  onClick={createStory}
                >

                  <Share2 size={16} />

                  Share Story

                </button>

              </div>

            </div>

          )}

        </section>


        {/* CREATE */}

        <section className="create-card">

          <div className="avatar">

            {currentUser?.profile_picture ? (

              <img
                src={imageUrl(
                  currentUser.profile_picture
                )}
                alt=""
              />

            ) : (

              <span>
                {getInitial(
                  currentUsername
                )}
              </span>

            )}

          </div>


          <button
            className="create-input"
            onClick={() =>
              setShowCreate(true)
            }
          >
            What's on your mind?
          </button>


          <button
            className="photo-button"
            onClick={() =>
              setShowCreate(true)
            }
          >

            <ImageIcon />

          </button>

        </section>


        {/* POSTS */}

        {loading ? (

          <div className="state-card">

            <div className="loader" />

            <p>
              Loading your feed...
            </p>

          </div>

        ) : posts.length === 0 ? (

          <div className="state-card">

            <Sparkles size={42} />

            <h3>
              Start your journey
            </h3>

            <p>
              Create your first post and
              share something with your community.
            </p>

            <button
              onClick={() =>
                setShowCreate(true)
              }
            >
              Create post
            </button>

          </div>

        ) : (

          posts.map((post) => (

            <article
              className="post"
              key={post.id}
            >

              <div className="post-top">

                <div className="post-author">

                  <div className="avatar">

                    {post.user
                      ?.profile_picture ? (

                      <img
                        src={imageUrl(
                          post.user
                            .profile_picture
                        )}
                        alt=""
                      />

                    ) : (

                      <span>
                        {getInitial(
                          post.user
                            ?.username
                        )}
                      </span>

                    )}

                  </div>


                  <div className="author-info">

                    <strong>
                      {post.user?.username}
                    </strong>

                    <small>
                      {formatDate(
                        post.created_at
                      )}
                    </small>

                  </div>

                </div>


                {post.user?.id ===
                  currentUserId && (

                  <button
                    className="delete-button"
                    onClick={() =>
                      handleDelete(
                        post.id
                      )
                    }
                    title="Delete post"
                  >

                    <Trash2 size={17} />

                  </button>

                )}

              </div>


              {post.content && (

                <p className="caption">
                  {post.content}
                </p>

              )}


              {post.image && (

                <div className="media-wrapper">

                  <img
                    className="post-image"
                    src={imageUrl(
                      post.image
                    )}
                    alt="Post"
                  />

                </div>

              )}


              {post.video && (

                <div className="media-wrapper">

                  <video
                    className="post-video"
                    src={imageUrl(
                      post.video
                    )}
                    controls
                    playsInline
                    preload="metadata"
                  />

                </div>

              )}


              <div className="post-actions">

                <div className="post-left-actions">

                  <button
                    className={
                      post.liked_by_me
                        ? "action liked"
                        : "action"
                    }
                    onClick={() =>
                      handleLike(
                        post.id
                      )
                    }
                  >

                    <Heart
                      fill={
                        post.liked_by_me
                          ? "currentColor"
                          : "none"
                      }
                    />

                    <span>
                      {post.likes_count || 0}
                    </span>

                  </button>


                  <button
                    className="action"
                    onClick={() =>
                      document
                        .getElementById(
                          `comment-${post.id}`
                        )
                        ?.focus()
                    }
                  >

                    <MessageCircle />

                    <span>
                      {post.comments_count ??
                        post.comments?.length ??
                        0}
                    </span>

                  </button>


                  <button
                    className="action"
                    onClick={() =>
                      handleShareToStory(
                        post.id
                      )
                    }
                    title="Share to Story"
                  >

                    <Share2 />

                  </button>

                </div>


                <button
                  className={
                    post.saved_by_me
                      ? "action saved"
                      : "action"
                  }
                  onClick={() =>
                    handleSave(
                      post.id
                    )
                  }
                  title="Save post"
                >

                  <Bookmark
                    fill={
                      post.saved_by_me
                        ? "currentColor"
                        : "none"
                    }
                  />

                </button>

              </div>


              {post.comments?.length > 0 && (

                <div className="comment-list">

                  {post.comments
                    .slice(-4)
                    .map((comment) => (

                      <div
                        className="comment"
                        key={comment.id}
                      >

                        <strong>
                          {comment.user?.username}
                        </strong>

                        <span>
                          {comment.content}
                        </span>

                      </div>

                    ))}

                </div>

              )}


              <div className="comment-box">

                <input
                  id={`comment-${post.id}`}
                  value={
                    comments[post.id] || ""
                  }
                  onChange={(e) =>
                    setComments(
                      (old) => ({
                        ...old,
                        [post.id]:
                          e.target.value,
                      })
                    )
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key === "Enter"
                    ) {

                      handleComment(
                        post.id
                      );

                    }

                  }}
                  placeholder="Add a comment..."
                />


                <button
                  onClick={() =>
                    handleComment(
                      post.id
                    )
                  }
                >

                  <Send size={17} />

                </button>

              </div>

            </article>

          ))

        )}

      </main>


      {/* RIGHT PANEL */}

      <aside className="right-panel">

        <div className="search">

          <Search size={18} />

          <input
            className="search-input"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search people"
          />

        </div>


        <section className="suggestions">

          <div className="section-heading">

            <div>

              <strong>
                {search
                  ? "Search results"
                  : "Suggested for you"}
              </strong>

              <small>
                Discover people
              </small>

            </div>

            <UserPlus size={18} />

          </div>


          {users
            .filter(
              (user) =>
                user.id !== currentUserId
            )
            .slice(0, 7)
            .map((user) => (

              <div
                className="suggestion"
                key={user.id}
              >

                <div className="suggestion-person">

                  <div className="avatar small">

                    {user.profile_picture ? (

                      <img
                        src={imageUrl(
                          user.profile_picture
                        )}
                        alt=""
                      />

                    ) : (

                      <span>
                        {getInitial(
                          user.username
                        )}
                      </span>

                    )}

                  </div>


                  <div className="suggestion-info">

                    <strong>
                      {user.username}
                    </strong>

                    <small>
                      {user.followers_count || 0}
                      {" "}
                      followers
                    </small>

                  </div>

                </div>


                <button
                  className={
                    user.is_following
                      ? "follow following"
                      : "follow"
                  }
                  onClick={() =>
                    handleFollow(
                      user.id
                    )
                  }
                >

                  {user.is_following ? (

                    <>
                      <UserCheck size={14} />
                      Following
                    </>

                  ) : (

                    <>
                      <UserPlus size={14} />
                      Follow
                    </>

                  )}

                </button>

              </div>

            ))}


          {users.filter(
            (user) =>
              user.id !== currentUserId
          ).length === 0 && (

            <div className="no-users">
              No people found.
            </div>

          )}

        </section>


        <div className="your-profile">

          <div className="avatar">

            {currentUser?.profile_picture ? (

              <img
                src={imageUrl(
                  currentUser.profile_picture
                )}
                alt=""
              />

            ) : (

              <span>
                {getInitial(
                  currentUsername
                )}
              </span>

            )}

          </div>


          <div className="your-profile-info">

            <strong>
              @{currentUsername}
            </strong>

            <small>
              {currentUser?.posts_count ??
                myPosts.length}
              {" "}
              posts
            </small>

          </div>


          <button
            onClick={() =>
              setShowProfile(true)
            }
          >
            View
          </button>

        </div>


        <div className="quick-stats">

          <div>

            <strong>
              {currentUser?.posts_count ??
                myPosts.length}
            </strong>

            <span>
              Posts
            </span>

          </div>


          <div>

            <strong>
              {currentUser?.followers_count ??
                0}
            </strong>

            <span>
              Followers
            </span>

          </div>


          <div>

            <strong>
              {currentUser?.following_count ??
                0}
            </strong>

            <span>
              Following
            </span>

          </div>

        </div>


        <p className="footer-note">
          © 2026 Connectly
        </p>

      </aside>


      {/* CREATE MODAL */}

      {showCreate && (

        <div
          className="overlay"
          onClick={() =>
            setShowCreate(false)
          }
        >

          <div
            className="create-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>

                <h2>
                  Create new post
                </h2>

                <small>
                  Share a photo or video
                </small>

              </div>


              <button
                onClick={() =>
                  setShowCreate(false)
                }
              >

                <X />

              </button>

            </div>


            <textarea
              value={caption}
              onChange={(e) =>
                setCaption(
                  e.target.value
                )
              }
              placeholder="Write a caption..."
            />


            {postFile && (

              <div className="file-preview">

                {postFile.type.startsWith(
                  "video/"
                ) ? (

                  <video
                    src={URL.createObjectURL(
                      postFile
                    )}
                    controls
                    muted
                  />

                ) : (

                  <img
                    src={URL.createObjectURL(
                      postFile
                    )}
                    alt="Preview"
                  />

                )}


                <button
                  className="preview-remove"
                  onClick={() =>
                    setPostFile(null)
                  }
                >

                  <X />

                </button>

              </div>

            )}


            <div className="modal-footer">

              <label className="add-photo">

                <ImageIcon size={19} />

                <span>
                  Photo / Video
                </span>

                <input
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={(e) =>
                    setPostFile(
                      e.target.files?.[0] ||
                      null
                    )
                  }
                />

              </label>


              <button
                className="share-button"
                disabled={
                  posting ||
                  (
                    !caption.trim() &&
                    !postFile
                  )
                }
                onClick={createPost}
              >

                {posting
                  ? "Posting..."
                  : "Share"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* NOTIFICATIONS */}

      {showNotifications && (

        <div
          className="overlay"
          onClick={() =>
            setShowNotifications(
              false
            )
          }
        >

          <div
            className="notification-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>

                <h2>
                  Notifications
                </h2>

                <small>
                  Your latest activity
                </small>

              </div>


              <button
                onClick={() =>
                  setShowNotifications(
                    false
                  )
                }
              >

                <X />

              </button>

            </div>


            {notifications.length === 0 ? (

              <div className="empty-notifications">

                <Bell size={42} />

                <h3>
                  No notifications yet
                </h3>

                <p>
                  Likes, comments and follows
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="notification-list">

                {notifications.map(
                  (notification) => (

                    <div
                      className={
                        notification.is_read
                          ? "notification"
                          : "notification unread"
                      }
                      key={
                        notification.id
                      }
                    >

                      <div className="avatar small">

                        {notification.sender
                          ?.profile_picture ? (

                          <img
                            src={imageUrl(
                              notification
                                .sender
                                .profile_picture
                            )}
                            alt=""
                          />

                        ) : (

                          <span>
                            {getInitial(
                              notification
                                .sender
                                ?.username
                            )}
                          </span>

                        )}

                      </div>


                      <div>

                        <strong>
                          {
                            notification
                              .sender
                              ?.username
                          }
                        </strong>

                        <p>
                          {
                            notification
                              .message
                          }
                        </p>

                        <small>
                          {formatDate(
                            notification.created_at
                          )}
                        </small>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      )}


      {/* PROFILE */}

      {showProfile && (

        <div
          className="overlay"
          onClick={() =>
            setShowProfile(false)
          }
        >

          <div
            className="profile-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-title">

              <div>

                <h2>
                  @{currentUsername}
                </h2>

                <small>
                  Your Connectly profile
                </small>

              </div>


              <button
                onClick={() =>
                  setShowProfile(false)
                }
              >

                <X />

              </button>

            </div>


            <div className="profile-banner">

              <div className="profile-banner-glow" />

            </div>


            <div className="profile-content">

              <div className="profile-header">

                <div className="profile-big-avatar">

                  {currentUser?.profile_picture ? (

                    <img
                      src={imageUrl(
                        currentUser
                          .profile_picture
                      )}
                      alt=""
                    />

                  ) : (

                    <span>
                      {getInitial(
                        currentUsername
                      )}
                    </span>

                  )}

                </div>


                <div className="profile-main-info">

                  <h2>
                    @{currentUsername}
                  </h2>

                  <p>
                    {currentUser?.bio ||
                      "Welcome to my Connectly profile."}
                  </p>

                </div>

              </div>


              <div className="profile-stats">

                <div>

                  <strong>
                    {currentUser?.posts_count ??
                      myPosts.length}
                  </strong>

                  <span>
                    Posts
                  </span>

                </div>


                <div>

                  <strong>
                    {currentUser?.followers_count ??
                      0}
                  </strong>

                  <span>
                    Followers
                  </span>

                </div>


                <div>

                  <strong>
                    {currentUser?.following_count ??
                      0}
                  </strong>

                  <span>
                    Following
                  </span>

                </div>

              </div>


              <div className="profile-grid">

                {myPosts.length === 0 ? (

                  <div className="profile-empty">

                    <ImageIcon size={35} />

                    <p>
                      No posts yet.
                    </p>

                  </div>

                ) : (

                  myPosts.map((post) => (

                    <div
                      className="grid-item"
                      key={post.id}
                    >

                      {post.image ? (

                        <img
                          src={imageUrl(
                            post.image
                          )}
                          alt=""
                        />

                      ) : post.video ? (

                        <div className="grid-video">

                          <video
                            src={imageUrl(
                              post.video
                            )}
                            muted
                          />

                          <Video size={18} />

                        </div>

                      ) : (

                        <div className="grid-text">

                          {post.content}

                        </div>

                      )}

                    </div>

                  ))

                )}

              </div>

            </div>

          </div>

        </div>

      )}


      {/* STORY VIEWER */}

      {activeStory && (

        <div className="story-viewer">

          <button
            className="story-close"
            onClick={() =>
              setStoryViewer(null)
            }
          >

            <X />

          </button>


          <button
            className="story-nav left"
            onClick={previousStory}
          >

            <ChevronLeft />

          </button>


          <div className="story-viewer-card">

            <div className="story-viewer-top">

              <div className="story-viewer-user">

                <div className="avatar small">

                  {activeStory.user
                    ?.profile_picture ? (

                    <img
                      src={imageUrl(
                        activeStory.user
                          .profile_picture
                      )}
                      alt=""
                    />

                  ) : (

                    <span>
                      {getInitial(
                        activeStory.user
                          ?.username
                      )}
                    </span>

                  )}

                </div>


                <div>

                  <strong>
                    {activeStory.user?.username}
                  </strong>

                  <small>
                    {formatDate(
                      activeStory.created_at
                    )}
                  </small>

                </div>

              </div>


              <span className="story-counter">

                {storyViewer + 1}
                {" / "}
                {stories.length}

              </span>

            </div>


            <div className="story-viewer-media">

              {activeStory.video ? (

                <video
                  key={
                    activeStory.id
                  }
                  className="story-viewer-video"
                  src={imageUrl(
                    activeStory.video
                  )}
                  autoPlay
                  controls
                  playsInline
                />

              ) : activeStory.image ? (

                <img
                  key={
                    activeStory.id
                  }
                  className="story-viewer-image"
                  src={imageUrl(
                    activeStory.image
                  )}
                  alt=""
                />

              ) : activeStory.post ? (

                <div className="shared-story-post">

                  <div className="shared-story-label">

                    <Share2 size={16} />

                    Shared post

                  </div>


                  {activeStory.post.image && (

                    <img
                      src={imageUrl(
                        activeStory.post.image
                      )}
                      alt=""
                    />

                  )}


                  {activeStory.post.video && (

                    <video
                      src={imageUrl(
                        activeStory.post.video
                      )}
                      controls
                      autoPlay
                      playsInline
                    />

                  )}


                  {activeStory.post.content && (

                    <p>
                      {
                        activeStory.post
                          .content
                      }
                    </p>

                  )}

                </div>

              ) : (

                <div className="story-empty">

                  Story unavailable.

                </div>

              )}

            </div>


            <div className="story-viewer-bottom">

              <span>
                Connectly Story
              </span>

            </div>

          </div>


          <button
            className="story-nav right"
            onClick={nextStory}
          >

            <ChevronRight />

          </button>

        </div>

      )}

    </div>
  );
}


export default Home;