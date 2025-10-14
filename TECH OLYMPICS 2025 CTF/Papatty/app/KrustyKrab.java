import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import java.nio.file.*;
import java.util.Base64;
import java.net.HttpURLConnection;
import java.net.URL;

class User implements Serializable {
    private String email;
    private String name;
    private String password;
    private String lastIp;

    public User(String email, String name, String password, String ip){
        this.email = email;
        this.name = name;
        this.password = password;
        this.lastIp = ip;
    }

    public String getEmail() {
        return this.email;
    }

    public String getName(){
        return this.name;
    }

    public String getLastIp(){
        return this.lastIp;
    }

    public boolean checkPassword(String pass){
        return this.password.equals(pass);
    }

    public String toString(){
        return this.name;
    }
}

public class KrustyKrab extends HttpServlet {

    private static Map<String, User> users = new HashMap<>();

    private static boolean adminInited = false;

    private String style = "<style>body{font-family:sans-serif;background:#f4f4f4;text-align:center;padding:50px;}form{background:#fff;padding:20px;margin:auto;width:300px;border-radius:10px;box-shadow:0 0 10px #aaa;}input{margin:5px;padding:8px;width:90%;}button{padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:5px;cursor:pointer;}button:hover{background:#0056b3;}</style>";

    private void initAdmin(){
        if(adminInited){
            return;
        }
        adminInited = true;
        User adminUser = new User("admin@admin.com", "admin", "fakePassword", "127.0.0.1");
        users.put("admin@admin.com", adminUser);
    }

    private void renderForm(HttpServletResponse response, String title, String action, boolean signup) throws IOException {
        PrintWriter out = response.getWriter();
        response.setContentType("text/html");
        out.println("<html><head><title>" + title + "</title>" + style + "</head><body>");
        out.println("<h2>" + title + "</h2>");
        out.println("<img src='https://upload.wikimedia.org/wikipedia/commons/c/ce/Mr_Krabs_character.png' alt='Mr Krabs' style='max-width:200px; height:auto;'/><br/>");
        out.println("<form method='POST' action='" + action + "'>");
        out.println("<input type='email' name='email' placeholder='Email' required/><br/>");
        if(signup){
            out.println("<input type='text' name='name' placeholder='Name' required/><br/>");
        }
        out.println("<input type='password' name='password' placeholder='Password' required/><br/>");
        out.println("<button type='submit'>Submit</button></form>");
        out.println("<p>Don't have an account? <a href='/signup'>Signup</a></p>");
        out.println("</body></html>");
    }

    public String extractSecretForumlaFromSafeBox(){
        try {
            return new String(Files.readAllBytes(Paths.get("/safebox/secretformula_for_plankton.txt")));
        } catch (Exception e) {
            return "Error";
        }
    }

    public void clearCookies(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                Cookie removedCookie = new Cookie(cookie.getName(), "");
                removedCookie.setMaxAge(0);
                response.addCookie(removedCookie);
            }
        }
    }

    private String generateCookie(User user) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(baos);
        oos.writeObject(user);
        oos.close();
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    private User extractUser(String encoded) throws IOException, ClassNotFoundException {
        byte[] data = Base64.getDecoder().decode(encoded);
        ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data));
        User user = (User) ois.readObject();
        ois.close();
        return user;
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if(!adminInited){
            initAdmin();
        }

        String path = request.getServletPath();

        if("/login".equals(path)){
            clearCookies(request, response);
            renderForm(response, "Login", "login", false);
        } else if ("/signup".equals(path)){
            clearCookies(request, response);
            renderForm(response, "Sign Up", "signup", true);
        } else if ("/".equals(path)){
            Cookie[] cookies = request.getCookies();
            if(cookies != null){
                for(Cookie c : cookies){
                    if("user".equals(c.getName())){
                        try{
                            User u = extractUser(c.getValue());
                            response.setContentType("text/html");
                            PrintWriter out = response.getWriter();
                            out.println("<html><head>" + style + "</head><body>");
                            out.println("<h2>Welcome back, " + u.getName() + "!</h2>");
                            out.println("<p>Your last IP: " + u.getLastIp() + "</p>");
                            out.println("<br/><img src='https://upload.wikimedia.org/wikipedia/en/7/70/Krusty_Krab_interior_50b.png' alt='Krusty Krab' style='max-width:200px; height:auto;'/><br/>");
                            out.println("</body></html>");
                            return;
                        } catch(Exception e){ }
                    }
                }
            }
            response.sendRedirect("login");
        } else if ("/secretformula".equals(path)) {
            Cookie[] cookies = request.getCookies();
            if(cookies != null){
                for(Cookie c : cookies){
                    if("user".equals(c.getName())){
                        try{
                            User u = extractUser(c.getValue());
                            if("Admin@admin.com".equals(u.getEmail())){
                                response.setContentType("text/html");
                                response.getWriter().println("<h2>"+extractSecretForumlaFromSafeBox()+"</h2>");
                                return;
                            }
                        } catch(Exception e){ 
                            return;
                        }
                    }
                }
            }
            clearCookies(request, response);
            response.sendRedirect("login");
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if(!adminInited){
            initAdmin();
        }

        try {
            String path = request.getServletPath();
            String email = request.getParameter("email").toLowerCase();
            String pass = request.getParameter("password");
            String ip = request.getRemoteAddr();

            if("/signup".equals(path)){
                String name = request.getParameter("name");
                if(users.containsKey(email)){
                    response.getWriter().println("<p>User already exists!</p>");
                    return;
                }
                User u = new User(email, name, pass, ip);
                users.put(email, u);
                String cookieVal = generateCookie(u);
                Cookie ck = new Cookie("user", cookieVal);
                ck.setMaxAge(3600);
                response.addCookie(ck);
                response.sendRedirect("/");
            } else if ("/login".equals(path)){
                if(users.containsKey(email) && users.get(email).checkPassword(pass)){
                    User u = users.get(email);
                    String cookieVal = generateCookie(u);
                    Cookie ck = new Cookie("user", cookieVal);
                    ck.setMaxAge(3600);
                    response.addCookie(ck);
                    response.sendRedirect("/");
                } else {
                    response.getWriter().println("<p>Invalid credentials!</p>");
                }
            }
        } catch (Exception e){
            e.printStackTrace();
        }
    }
}
