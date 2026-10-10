package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.*;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
@Service
public class CategoryService {
    private final CategoryRepository categories;
    private final CampaignAuthorization access;
    public CategoryService(CategoryRepository categories, CampaignAuthorization access) { this.categories=categories; this.access=access; }
    @Transactional(readOnly=true)
    public PageResult<CategoryDto> list(CampaignQuery query) { return categories.list(query,CategoryRepository.Visibility.ACTIVE).map(CategoryDto::from); }
    @Transactional(readOnly=true)
    public PageResult<CategoryDto> adminList(UUID actor, CampaignQuery query) { access.admin(actor); return categories.list(query,CategoryRepository.Visibility.ALL).map(CategoryDto::from); }
    @Transactional
    public CategoryDto create(UUID actor, CategoryRequest request) {
        access.admin(actor);
        if (request.name()==null || request.name().isBlank()) throw new CampaignViolation("VALIDATION_ERROR","Enter a category name","name");
        String base=ReadableSlug.base(request.name()); categories.lockSlug(base);
        String slug=base;
        for (int attempts=0; categories.slugExists(slug); attempts++) {
            if (attempts>=5) throw ApplicationFailure.conflict("Unable to allocate category slug");
            slug=ReadableSlug.suffix(base);
        }
        var category=new CampaignCategory(request.name(),slug,request.description());
        if (Boolean.FALSE.equals(request.active())) category.edit(category.name(),category.description(),false);
        return CategoryDto.from(categories.save(category));
    }
    @Transactional
    public CategoryDto edit(UUID id, UUID actor, CategoryRequest request) {
        access.admin(actor);
        var category=categories.lock(id).orElseThrow(()->ApplicationFailure.missing("Category not found"));
        if (request.version()==null) throw new CampaignViolation("VALIDATION_ERROR","Version is required","version");
        category.requireVersion(request.version());
        if (request.clearDescription() && request.description()!=null) throw new CampaignViolation("VALIDATION_ERROR","Choose description or clearDescription","description");
        category.edit(request.name()==null?category.name():request.name(),request.clearDescription()?null:request.description()==null?category.description():request.description(),request.active()==null?category.active():request.active());
        return CategoryDto.from(categories.save(category));
    }
}
