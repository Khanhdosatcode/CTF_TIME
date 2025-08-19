package sekai;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static sekai.UserAuthenticationClient.getSession;
import static sekai.UserAuthenticationClient.login;
import static sekai.Util.parseQuery;

public class Main {

    public static void main(String[] args) throws IOException {
        var port = Integer.parseInt(System.getenv().getOrDefault("PORT", "1337"));
        var server = HttpServer.create(new java.net.InetSocketAddress(port), 0);

        server.createContext("/", req -> {
            var code = 200;
            var response = "";

            try {
                if ("POST".equals(req.getRequestMethod())) {
                    var formData = parseQuery(new String(req.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                    response = switch (req.getRequestURI().getPath()) {
                        case "/orders" -> {
                            if (!formData.containsKey("sessionId")) {
                                code = 400;
                                yield "Missing sessionId";
                            }
                            var authnUser = getSession(formData.get("sessionId"));
                            if (authnUser == null) {
                                code = 401;
                                yield "Unauthorized";
                            }
                            var fields = formData.get("fields");
                            if (!Util.validateFields(fields)) {
                                code = 400;
                                yield "Invalid fields";
                            }

                            var sql = "select %s from Order o where o.username=\"%s\"".formatted(fields, authnUser);
                            var et = HibernateUtil.getSessionFactory().createEntityManager();
                            var result = et.createQuery(sql).getResultList();

                            var sb = new StringBuilder();
                            sb.append("[");
                            for (int i = 0; i < result.size(); i++) {
                                sb.append(result.get(i).toString());
                                if (i < result.size() - 1) {
                                    sb.append(", ");
                                }
                            }
                            sb.append("]");
                            yield sb.toString();
                        }
                        case "/login" -> {
                            var user = formData.get("username");
                            var pass = formData.get("password");

                            if (user == null || pass == null) {
                                code = 400;
                                yield "Missing username or password";
                            }

                            var sid = login(user, pass);
                            if (sid == null) {
                                code = 401;
                                yield "Unauthorized";
                            } else {
                                yield sid;
                            }
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
