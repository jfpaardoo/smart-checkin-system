package org.springframework.samples.smartcheckin.formation;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
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

    private static final String FORMATION_NOT_FOUND_MSG = "Formation not found";

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
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        
        User user = userService.findByPersonalCode(personalCode);

        if (!formation.getAttendees().contains(user)) {
            formation.getAttendees().add(user);
            formationRepository.save(formation);
        }
    }

    @Transactional
    public Formation updateFormation(Formation formation, Integer id) {
        Formation toUpdate = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        toUpdate.setName(formation.getName());
        toUpdate.setDescription(formation.getDescription());
        toUpdate.setFormationDate(formation.getFormationDate());
        return formationRepository.save(toUpdate);
    }

    @Transactional
    public void addAttendee(Integer formationId, Integer userId) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        User user = userService.findUser(userId);
        
        if (!formation.getAttendees().contains(user)) {
            formation.getAttendees().add(user);
            formationRepository.save(formation);
        }
    }

    @Transactional
    public void removeAttendee(Integer formationId, Integer userId) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        User user = userService.findUser(userId);
        
        if (formation.getAttendees().contains(user)) {
            formation.getAttendees().remove(user);
            formationRepository.save(formation);
        }
    }
}
