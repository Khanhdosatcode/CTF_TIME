package sekai;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class UserAuthenticationClient {

    private static final String USER_SERVICE_URL = "http://127.0.0.1:8000";

    public static String login(String u, String p) throws IOException {
        if (!u.matches("^[a-zA-Z0-9]+$")) {
            throw new IllegalArgumentException("Username must be alphanumeric");
        }

        var url = new URL(USER_SERVICE_URL + "/login");
        var conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

        var postData = "username=" + u + "&password=" + Util.md5(p);

        try (var os = conn.getOutputStream()) {
            os.write(postData.getBytes(StandardCharsets.UTF_8));
        }

        var status = conn.getResponseCode();
        if (status != 200) {
            return null; // Return null if login fails
        }

        var response = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        conn.disconnect();

        var parts = response.split("=");
        return parts.length == 2 ? parts[1].trim() : null;
    }

    public static String getSession(String sessionId) throws IOException {
        if (!sessionId.matches("^[0-9a-fA-F]+$")) {
            throw new IllegalArgumentException("Session ID must be hexadecimal");
        }

        var url = new URL(USER_SERVICE_URL + "/sessionInfo");
        var conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

        var postData = "sessionId=" + sessionId;
        try (var os = conn.getOutputStream()) {
            os.write(postData.getBytes(StandardCharsets.UTF_8));
        }

        var status = conn.getResponseCode();
        if (status != 200) {
            return null; // Return null if the session is not valid
        }

        var response = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        conn.disconnect();

        var parts = response.split("=");
        return parts.length == 2 ? parts[1].trim() : null;
    }

}
