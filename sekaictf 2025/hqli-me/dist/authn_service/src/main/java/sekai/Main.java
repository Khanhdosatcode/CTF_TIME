package sekai;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static sekai.HibernateUtil.addUser;
import static sekai.Util.parseQuery;

public class Main {

    public static void main(String[] args) throws IOException {
        // Create a new 'guest' user
        var guest = addUser(new User("guest", "guest"));
        System.out.printf("Created guest user with id %s\n", guest.id);

        var port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8000"));
        var server = HttpServer.create(new java.net.InetSocketAddress(port), 0);

        server.createContext("/", req -> {
            var code = 200;
            var response = "";

            try {
                if ("POST".equals(req.getRequestMethod())) {
                    var formData = parseQuery(new String(req.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                    response = switch (req.getRequestURI().getPath()) {
                        case "/sessionInfo" -> {
                            if (!formData.containsKey("sessionId")) {
                                code = 400;
                                yield "Missing sessionId";
                            }
                            var sessionId = formData.get("sessionId");

                            var et = HibernateUtil.getSessionFactory().createEntityManager();
                            var sql = "select s from Session s where s.sessionId = \"%s\"".formatted(sessionId);
                            var result = et.createQuery(sql).getResultList();
                            if (result.isEmpty()) {
                                code = 401;
                                yield "Unauthorized";
                            }

                            var session = (Session) result.get(0);
                            yield "user=" + session.user.username;
                        }
                        case "/login" -> {
                            var sql = "select u from User u where u.username = \"%s\" and u.password = \"%s\"".formatted(
                                    formData.get("username"),
                                    formData.get("password")
                            );
                            var et = HibernateUtil.getSessionFactory().createEntityManager();
                            var result = et.createQuery(sql).getResultList();
                            if (result.isEmpty()) {
                                code = 401;
                                yield "Invalid username or password";
                            }
                            var user = (User) result.get(0);

                            var session = HibernateUtil.addSession(new Session(user, null));
                            yield "sessionId=" + session.sessionId;
                        }
                        default -> {
                            code = 404;
                            yield "Not found";
                        }
                    };
                } else {
                    response = "Method Not Allowed";
                    code = 405;
                }
            } catch (Exception e) {
                e.printStackTrace();
                code = 500;
                response = "Internal Server Error";
            }

            req.sendResponseHeaders(code, 0);
            var os = req.getResponseBody();
            os.write(response.getBytes());
            os.close();
        });

        server.start();
        System.out.printf("Server listening on :%s\n", port);
    }

}
