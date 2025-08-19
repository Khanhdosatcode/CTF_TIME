package sekai;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class Util {

    public static Map<String, String> parseQuery(String query) {
        return query == null ? Map.of() : Arrays.stream(query.split("&"))
                                                .map(param -> param.split("=", 2))
                                                .collect(Collectors.toMap(
                                                        pair -> URLDecoder.decode(pair[0], StandardCharsets.UTF_8),
                                                        pair -> URLDecoder.decode(pair.length > 1 ? pair[1] : "",
                                                                                  StandardCharsets.UTF_8)
                                                ));
    }

    public static String md5(String input) {
        try {
            var hash = MessageDigest.getInstance("MD5").digest(input.getBytes());
            var hex = new StringBuilder();
            for (var b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public static boolean validateFields(String fields) {
        var tokens = fields.split(",");
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i].trim();
            // Check if it contains non-alphanumeric character
            if (Pattern.matches("\\W", token)) {
                return false;
            }
        }
        return true;
    }

}
