export default {
  api_secret: "", // optional
  openai: {
    apiKey: "", // optional
    baseURL: "https://openai.com/api/v1", // optional
  },
  allow_user_provide_api_key: false, // if true, user can provide their own api key in the request header without the secret
};