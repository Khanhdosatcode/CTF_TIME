package sekai;

import jakarta.persistence.*;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(unique = true, nullable = false)
    public String sessionId;

    public Session() {
    }

    public Session(User user, String sessionId) {
        this.user = user;
        this.sessionId = sessionId;
    }

    @PrePersist
    public void generateSessionId() {
        if (sessionId == null || sessionId.isEmpty()) {
            sessionId = new java.math.BigInteger(32 * 4, new java.security.SecureRandom()).toString(16);
        }
    }

}
