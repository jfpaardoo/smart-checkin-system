package org.springframework.samples.petclinic.formation;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.petclinic.user.User;
import org.springframework.samples.petclinic.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
public class FormationService {

    private final FormationRepository formationRepository;
    private final UserService userService;

    @Autowired
    public FormationService(FormationRepository formationRepository, UserService userService) {
        this.formationRepository = formationRepository;
        this.userService = userService;
    }

    @Transactional
    public Formation saveFormation(Formation formation) {
        return formationRepository.save(formation);
    }

    @Transactional(readOnly = true)
    public List<Formation> findAll() {
        return (List<Formation>) formationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Formation> findById(Integer id) {
        return formationRepository.findById(id);
    }

    @Transactional
    public void registerAttendance(Integer formationId, String personalCode) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException("Formation not found"));
        
        User user = userService.findByPersonalCode(personalCode);

        if (!formation.getAttendees().contains(user)) {
            formation.getAttendees().add(user);
            formationRepository.save(formation);
        }
    }
}
