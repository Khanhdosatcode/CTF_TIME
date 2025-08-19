package sekai;

import org.hibernate.SessionFactory;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.Configuration;

public class HibernateUtil {

    private static SessionFactory sessionFactory;

    public static synchronized SessionFactory getSessionFactory() {
        if (sessionFactory == null) {

            var configuration = getConfiguration();
            var serviceRegistry = new StandardServiceRegistryBuilder()
                    .applySettings(configuration.getProperties()).build();

            sessionFactory = configuration.buildSessionFactory(serviceRegistry);
        }
        return sessionFactory;
    }

    private static Configuration getConfiguration() {
        return new Configuration()
                .setProperty("hibernate.connection.driver_class", "org.h2.Driver")
                .setProperty("hibernate.connection.url", "jdbc:h2:mem:db")
                .setProperty("hibernate.connection.username", "root")
                .setProperty("hibernate.connection.password", "password")
                .setProperty("hibernate.hbm2ddl.auto", "update")
                .setProperty("hibernate.show_sql", "true")
                .addAnnotatedClass(User.class)
                .addAnnotatedClass(Session.class);
    }

    public static User addUser(User u) {
        var sessionFactory = getSessionFactory();
        var session = sessionFactory.openSession();
        var transaction = session.beginTransaction();
        session.persist(u);
        transaction.commit();
        return u;
    }

    public static Session addSession(Session s) {
        var sessionFactory = getSessionFactory();
        var session = sessionFactory.openSession();
        var transaction = session.beginTransaction();
        session.persist(s);
        transaction.commit();
        return s;
    }

}
