import React, { useEffect, useState } from "react";

import Home from "./pages/Home";

import api from "./services/api";

import "./App.css";


function AuthScreen({ onAuth, theme, onToggleTheme }) {

  const [mode, setMode] =
    useState("login");

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function submit(e) {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      let response;

      if (mode === "login") {

        response = await api.post(
          "login/",
          {
            username,
            password,
          }
        );

      } else {

        response = await api.post(
          "register/",
          {
            username,
            email,
            password,
          }
        );

      }


      const data = response.data;


      if (!data?.token) {
        throw new Error(
          "Authentication token was not received."
        );
      }


      localStorage.setItem(
        "connectly_token",
        data.token
      );

      localStorage.setItem(
        "token",
        data.token
      );


      if (data.user?.id) {

        localStorage.setItem(
          "userId",
          data.user.id
        );

      }


      if (data.user?.username) {

        localStorage.setItem(
          "username",
          data.user.username
        );

      }


      onAuth(data.user);

    } catch (err) {

      console.error(
        "Authentication error:",
        err
      );

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Something went wrong."
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="auth-page">

      <button
        className="auth-theme-button"
        onClick={onToggleTheme}
        type="button"
      >
        {theme === "dark"
          ? "☀️ Light"
          : "🌙 Dark"}
      </button>


      <div className="auth-card">

        <div className="auth-logo">
          Connectly
        </div>


        <p className="auth-tagline">
          Share moments. Connect people.
        </p>


        <form onSubmit={submit}>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            autoComplete="username"
            required
          />


          {mode === "register" && (

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />

          )}


          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete={
              mode === "login"
                ? "current-password"
                : "new-password"
            }
            required
          />


          {error && (

            <div className="error-box">
              {error}
            </div>

          )}


          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log in"
              : "Create account"}
          </button>

        </form>


        <div className="auth-switch">

          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}


          <button
            type="button"
            onClick={() => {

              setMode(
                mode === "login"
                  ? "register"
                  : "login"
              );

              setError("");

            }}
          >
            {mode === "login"
              ? "Sign up"
              : "Log in"}
          </button>

        </div>

      </div>

    </div>
  );
}


export default function App() {

  const [user, setUser] =
    useState(null);

  const [checking, setChecking] =
    useState(true);


  const [theme, setTheme] =
    useState(() => {

      return (
        localStorage.getItem(
          "connectly_theme"
        ) || "dark"
      );

    });


  useEffect(() => {

    document.documentElement.dataset.theme =
      theme;

    localStorage.setItem(
      "connectly_theme",
      theme
    );

  }, [theme]);


  const toggleTheme = () => {

    setTheme((current) =>
      current === "dark"
        ? "light"
        : "dark"
    );

  };


  useEffect(() => {

    const savedToken =
      localStorage.getItem(
        "connectly_token"
      );


    if (!savedToken) {

      setChecking(false);

      return;

    }


    api.get("me/")
      .then((response) => {

        const data =
          response.data;

        setUser(data);


        if (data?.id) {

          localStorage.setItem(
            "userId",
            data.id
          );

        }


        if (data?.username) {

          localStorage.setItem(
            "username",
            data.username
          );

        }

      })
      .catch((err) => {

        console.error(
          "Session error:",
          err
        );

        localStorage.removeItem(
          "connectly_token"
        );

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "userId"
        );

        localStorage.removeItem(
          "username"
        );

        setUser(null);

      })
      .finally(() => {

        setChecking(false);

      });

  }, []);


  const handleLogout = () => {

    localStorage.removeItem(
      "connectly_token"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "userId"
    );

    localStorage.removeItem(
      "username"
    );

    setUser(null);

  };


  if (checking) {

    return (
      <div className="loading-screen">
        Loading Connectly...
      </div>
    );

  }


  if (!user) {

    return (
      <AuthScreen
        onAuth={setUser}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );

  }


  return (
    <Home
      currentUser={user}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );

}