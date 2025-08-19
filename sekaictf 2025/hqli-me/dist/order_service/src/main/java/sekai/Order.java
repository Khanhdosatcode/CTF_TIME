package sekai;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue
    public Long id;

    public String username;

    public Order() {
    }

    public Order(String username) {
        this.username = username;
    }

}

