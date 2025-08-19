package sekai;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue
    public Long id;

    public String username;

    public String password;

    public User() {
    }

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    @PrePersist
    public void hashPassword() {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password hash cannot be null or empty");
        }
        this.password = Util.md5(this.password);
    }

}

