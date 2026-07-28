package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.time.ZoneId;
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
    private final FormationAttendanceRepository attendanceRepository;
    private final UserService userService;

    @Autowired
    public FormationService(FormationRepository formationRepository, 
                            FormationAttendanceRepository attendanceRepository, 
                            UserService userService) {
        this.formationRepository = formationRepository;
        this.attendanceRepository = attendanceRepository;
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

    private Formation doRegisterAttendance(Integer formationId, User user) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));

        Optional<FormationAttendance> existing = attendanceRepository.findByFormationAndUser(formation, user);
        if (!existing.isPresent()) {
            FormationAttendance att = new FormationAttendance();
            att.setFormation(formation);
            att.setUser(user);
            att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
            attendanceRepository.save(att);
            formation.getAttendances().add(att);
        } else {
            FormationAttendance att = existing.get();
            if (att.getCheckInDate() == null) {
                att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
                attendanceRepository.save(att);
            }
        }
        user.setIsWorking(true);
        userService.saveUser(user);
        return formation;
    }

    @Transactional
    public Formation registerAttendance(Integer formationId, User user) {
        return doRegisterAttendance(formationId, user);
    }

    @Transactional
    public Formation registerAttendance(Integer formationId, String personalCode) {
        User user = userService.findByPersonalCode(personalCode);
        return doRegisterAttendance(formationId, user);
    }

    @Transactional
    public Formation checkoutAttendance(Integer formationId, String personalCode, String signature) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        
        User user = userService.findByPersonalCode(personalCode);

        FormationAttendance att = attendanceRepository.findByFormationAndUser(formation, user)
            .orElseThrow(() -> new IllegalArgumentException("El usuario no ha hecho check-in en esta formación"));

        att.setCheckOutDate(LocalDateTime.now(ZoneId.systemDefault()));
        att.setSignature(signature);
        attendanceRepository.save(att);

        user.setIsWorking(false);
        userService.saveUser(user);

        return formation;
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
        
        Optional<FormationAttendance> existing = attendanceRepository.findByFormationAndUser(formation, user);
        if (!existing.isPresent()) {
            FormationAttendance att = new FormationAttendance();
            att.setFormation(formation);
            att.setUser(user);
            attendanceRepository.save(att);
        }
    }

    @Transactional
    public void removeAttendee(Integer formationId, Integer userId) {
        Formation formation = formationRepository.findById(formationId)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));
        User user = userService.findUser(userId);
        
        attendanceRepository.findByFormationAndUser(formation, user).ifPresent(attendanceRepository::delete);
    }

    @Transactional
    public void deleteFormation(Integer id) {
        Formation formation = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(FORMATION_NOT_FOUND_MSG));

        if (formation.getAttendances() != null && !formation.getAttendances().isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar la formación porque contiene usuarios inscritos. Elimine primero a los asistentes.");
        }

        formationRepository.delete(formation);
    }
}