package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.campaign.application.PublishedActivityRepository;
import vn.edu.dut.connect.shared.application.PageResult;

@Repository
public class PublishedActivityPersistence implements PublishedActivityRepository {
    private final JdbcClient jdbc;
    private static final String SELECT = "select id, content->:lang->>'title' title, content->:lang->>'summary' summary, " +
        "content->:lang->>'description' description, content->:lang->>'organizer' organizer, " +
        "content->:lang->>'location' location, category, content->:lang->>'period' period, " +
        "published_on, image_url, source_url from dut_connect.published_activities";
    public PublishedActivityPersistence(JdbcClient jdbc) {this.jdbc = jdbc;}
    private static final org.springframework.jdbc.core.RowMapper<Activity> MAPPER = (rs, row) -> new Activity(
        rs.getObject("id", UUID.class), rs.getString("title"), rs.getString("summary"), rs.getString("description"),
        rs.getString("organizer"), rs.getString("location"), rs.getString("category"), rs.getString("period"),
        rs.getDate("published_on").toLocalDate(), rs.getString("image_url"), rs.getString("source_url"));
    public PageResult<Activity> list(String lang, String q, String category, int page, int size) {
        String where = " where content::text ilike :query and (:category='' or category=:category)";
        long total = jdbc.sql("select count(*) from dut_connect.published_activities" + where)
            .param("query", "%" + q + "%").param("category", category).query(Long.class).single();
        var items = jdbc.sql(SELECT + where + " order by published_on desc,id limit :size offset :offset")
            .param("lang", lang).param("query", "%" + q + "%").param("category", category)
            .param("size", size).param("offset", (long) page * size).query(MAPPER).list();
        int pages = (int) ((total + size - 1) / size);
        return new PageResult<>(items, page, size, total, pages, page + 1 < pages, page > 0);
    }
    public Optional<Activity> find(UUID id, String language) {
        return jdbc.sql(SELECT + " where id=:id").param("lang", language).param("id", id).query(MAPPER).optional();
    }
}
