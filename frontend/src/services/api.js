const API_BASE_URL = "http://127.0.0.1:8000/api/";


const getToken = () => {
  return localStorage.getItem("token");
};


const request = async (
  endpoint,
  options = {}
) => {

  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };


  if (token) {
    headers.Authorization =
      `Token ${token}`;
  }


  const isFormData =
    options.body instanceof FormData;


  if (
    !isFormData &&
    options.body &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }


  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {

    const error =
      new Error(
        data?.error ||
        data?.detail ||
        `Request failed: ${response.status}`
      );

    error.response = {
      status: response.status,
      data,
    };

    throw error;
  }


  return {
    data,
    status: response.status,
  };
};


const api = {

  get: (endpoint) =>
    request(endpoint, {
      method: "GET",
    }),


  post: (
    endpoint,
    body = null
  ) =>
    request(endpoint, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : null,
    }),


  put: (
    endpoint,
    body = null
  ) =>
    request(endpoint, {
      method: "PUT",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : null,
    }),


  patch: (
    endpoint,
    body = null
  ) =>
    request(endpoint, {
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : null,
    }),


  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),

};


export default api;