package org.springframework.samples.smartcheckin.analytics;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.Month;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;

class AnalyticsServiceTests {

    private static final String COURSE_NAME = "Course";

    private UserRepository userRepository;
    private CheckinRepository checkinRepository;
    private FormationAttendanceRepository attendanceRepository;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        checkinRepository = mock(CheckinRepository.class);
        attendanceRepository = mock(FormationAttendanceRepository.class);
        FormationRepository formationRepository = mock(FormationRepository.class);
        analyticsService = new AnalyticsService(userRepository, checkinRepository, attendanceRepository, formationRepository);
    }

    @Test
    void testGetAllUsersAnalytics() {
        User user1 = new User();
        user1.setId(1);
        user1.setUsername("user1");
        user1.setFirstName("John");
        user1.setLastName("Doe");
        user1.setPersonalCode("1234");
        Authorities auth = new Authorities();
        auth.setAuthority("USER");
        user1.setAuthority(auth);

        when(userRepository.findAll()).thenReturn(List.of(user1));
        
        Checkin checkin1 = new Checkin();
        checkin1.setCheckInType(CheckinType.ENTRADA);
        checkin1.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 9, 0));
        
        Checkin checkin2 = new Checkin();
        checkin2.setCheckInType(CheckinType.SALIDA);
        checkin2.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 17, 0));
        
        when(checkinRepository.findByUserIdOrderByCheckInDateDesc(1)).thenReturn(List.of(checkin2, checkin1));

        Formation formation = new Formation();
        formation.setId(10);
        formation.setName(COURSE_NAME);
        formation.setFormationDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));

        FormationAttendance att = new FormationAttendance();
        att.setFormation(formation);
        att.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        att.setCheckOutDate(LocalDateTime.of(2026, Month.AUGUST, 1, 12, 0));
        att.setSignature("signature");

        when(attendanceRepository.findByUserId(1)).thenReturn(List.of(att));

        List<UserAnalyticsDTO> res = analyticsService.getAllUsersAnalytics("John");
        assertFalse(res.isEmpty());
        UserAnalyticsDTO dto = res.getFirst();
        assertEquals("John", dto.getFirstName());
        assertEquals(480L, dto.getTotalWorkMinutes());
        assertEquals(1, dto.getFormationsAssigned());
        assertEquals(100.0, dto.getAttendancePercentage());
        assertEquals(120L, dto.getTotalFormationMinutes());
    }

    @Test
    void testGetUserAnalyticsDetail() {
        User user1 = new User();
        user1.setId(1);
        user1.setUsername("user1");
        user1.setFirstName("John");
        user1.setLastName("Doe");
        user1.setPersonalCode("1234");
        
        when(userRepository.findById(1)).thenReturn(Optional.of(user1));
        
        Formation formation = new Formation();
        formation.setId(10);
        formation.setName(COURSE_NAME);
        
        FormationAttendance att = new FormationAttendance();
        att.setFormation(formation);
        att.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        att.setCheckOutDate(LocalDateTime.of(2026, Month.AUGUST, 1, 12, 0));
        att.setSignature("signature");
        
        when(attendanceRepository.findByUserId(1)).thenReturn(List.of(att));
        
        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
        assertTrue(res.isPresent());
        assertEquals("John", res.get().getFirstName());
        assertFalse(res.get().getFormationDetails().isEmpty());
        assertEquals("COMPLETED", res.get().getFormationDetails().getFirst().getStatus());
    }

    @Test
    void testGetAllUsersAnalyticsSearchFilters() {
        User u1 = new User();
        u1.setId(1);
        u1.setFirstName("Alice");
        u1.setLastName("Smith");
        u1.setUsername("asmith");
        u1.setPersonalCode("1111");

        User u2 = new User();
        u2.setId(2);
        u2.setFirstName("Bob");
        u2.setLastName("Jones");
        u2.setUsername("bjones");
        u2.setPersonalCode("2222");

        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        assertEquals(1, analyticsService.getAllUsersAnalytics("asmith").size());
        assertEquals(1, analyticsService.getAllUsersAnalytics("Smith").size());
        assertEquals(1, analyticsService.getAllUsersAnalytics("2222").size());
        assertEquals(0, analyticsService.getAllUsersAnalytics("nonexistent").size());
    }

    @Test
    void testFormationAttendanceStatuses() {
        User user = new User();
        user.setId(1);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        Formation f1 = new Formation();
        f1.setId(10);
        f1.setName("In Progress");

        FormationAttendance attInProgress = new FormationAttendance();
        attInProgress.setFormation(f1);
        attInProgress.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));

        Formation f2 = new Formation();
        f2.setId(11);
        f2.setName("Not Attended");

        FormationAttendance attNotAttended = new FormationAttendance();
        attNotAttended.setFormation(f2);

        when(attendanceRepository.findByUserId(1)).thenReturn(List.of(attInProgress, attNotAttended));

        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
        assertTrue(res.isPresent());
        assertEquals(2, res.get().getFormationDetails().size());
    }

    // --- NUEVOS TESTS DE COBERTURA Y RAMAS ---

    @Test
    void testGetUserAnalyticsWithNullUserId() {
        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(null);
        assertTrue(res.isEmpty());
    }

    @Test
    void testGetAllUsersAnalyticsExcludesAdmin() {
        User adminUser = new User();
        adminUser.setId(99);
        Authorities adminAuth = new Authorities();
        adminAuth.setAuthority("ADMIN");
        adminUser.setAuthority(adminAuth);

        User normalUser = new User();
        normalUser.setId(100);
        normalUser.setFirstName("Regular");
        Authorities normalAuth = new Authorities();
        normalAuth.setAuthority("USER");
        normalUser.setAuthority(normalAuth);

        when(userRepository.findAll()).thenReturn(List.of(adminUser, normalUser));

        List<UserAnalyticsDTO> res = analyticsService.getAllUsersAnalytics(null);
        assertEquals(1, res.size());
        assertEquals("Regular", res.get(0).getFirstName());
    }

    @Test
    void testGetAllUsersAnalyticsWithNullAndBlankSearch() {
        User u1 = new User();
        u1.setId(1);
        u1.setFirstName("Alice");

        when(userRepository.findAll()).thenReturn(List.of(u1));

        // Test with null search
        List<UserAnalyticsDTO> resNull = analyticsService.getAllUsersAnalytics(null);
        assertEquals(1, resNull.size());

        // Test with blank search
        List<UserAnalyticsDTO> resBlank = analyticsService.getAllUsersAnalytics("   ");
        assertEquals(1, resBlank.size());
    }

    @Test
    void testCalculateWorkMinutesUnpairedCheckins() {
        User user = new User();
        user.setId(1);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        // Salida sin entrada previa (debería ignorarse)
        Checkin c1 = new Checkin();
        c1.setCheckInType(CheckinType.SALIDA);
        c1.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 8, 0));

        // Entrada sin salida posterior (debería ignorarse en el cálculo de total)
        Checkin c2 = new Checkin();
        c2.setCheckInType(CheckinType.ENTRADA);
        c2.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));

        when(checkinRepository.findByUserIdOrderByCheckInDateDesc(1)).thenReturn(List.of(c1, c2));

        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
        assertTrue(res.isPresent());
        assertEquals(0L, res.get().getTotalWorkMinutes());
        assertEquals(2, res.get().getTotalCheckins());
    }

    @Test
    void testProcessFormationAttendanceWithNullFormation() {
        User user = new User();
        user.setId(1);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        // Asistencia con formación nula
        FormationAttendance attNullFormation = new FormationAttendance();
        attNullFormation.setFormation(null);

        when(attendanceRepository.findByUserId(1)).thenReturn(List.of(attNullFormation));

        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
        assertTrue(res.isPresent());
        // El detalle se debe descartar y la lista de details debe estar vacía
        assertTrue(res.get().getFormationDetails().isEmpty());
    }

    @Test
    void testEmptyStringSignatureInProcessFormationAttendance() {
        User user = new User();
        user.setId(1);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        Formation formation = new Formation();
        formation.setId(10);
        formation.setName(COURSE_NAME);
        
        FormationAttendance att = new FormationAttendance();
        att.setFormation(formation);
        att.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
        // Evaluamos el isBlank() de signature false
        att.setSignature("   ");

        when(attendanceRepository.findByUserId(1)).thenReturn(List.of(att));

        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
        assertTrue(res.isPresent());
        assertFalse(res.get().getFormationDetails().getFirst().getHasSignature());
    }

	@Test
    void testCalculateWorkMinutesInvalidOrChronologicallyBackwardsCheckins() {
        User user = new User();
        user.setId(1);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        // Entrada a las 10:00
        Checkin c1 = new Checkin();
        c1.setCheckInType(CheckinType.ENTRADA);
        c1.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));

        // Salida a las 9:00 (anterior a la entrada, evalúa isAfter a false)
        Checkin c2 = new Checkin();
        c2.setCheckInType(CheckinType.SALIDA);
        c2.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 9, 0));

        // Ordenamos cronológicamente como hace el método
        when(checkinRepository.findByUserIdOrderByCheckInDateDesc(1)).thenReturn(List.of(c2, c1));

        Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
        assertTrue(res.isPresent());
        assertEquals(0L, res.get().getTotalWorkMinutes());
    }

    @Test
    void testGetAllUsersAnalyticsWithCompanyFilter() {
        org.springframework.samples.smartcheckin.company.Company compA = new org.springframework.samples.smartcheckin.company.Company();
        compA.setId(10);
        compA.setName("Company A");

        org.springframework.samples.smartcheckin.company.Company compB = new org.springframework.samples.smartcheckin.company.Company();
        compB.setId(20);
        compB.setName("Company B");

        User userA = new User();
        userA.setId(1);
        userA.setUsername("userA");
        userA.setFirstName("Alice");
        userA.setCompany(compA);

        User userB = new User();
        userB.setId(2);
        userB.setUsername("userB");
        userB.setFirstName("Bob");
        userB.setCompany(compB);

        User userNoComp = new User();
        userNoComp.setId(3);
        userNoComp.setUsername("userC");
        userNoComp.setFirstName("Charlie");

        when(userRepository.findAll()).thenReturn(List.of(userA, userB, userNoComp));

        List<UserAnalyticsDTO> filteredA = analyticsService.getAllUsersAnalytics("", 10);
        assertEquals(1, filteredA.size());
        assertEquals("Alice", filteredA.getFirst().getFirstName());
        assertEquals("Company A", filteredA.getFirst().getCompanyName());

        List<UserAnalyticsDTO> filteredB = analyticsService.getAllUsersAnalytics("", 20);
        assertEquals(1, filteredB.size());
        assertEquals("Bob", filteredB.getFirst().getFirstName());

        List<UserAnalyticsDTO> all = analyticsService.getAllUsersAnalytics("");
        assertEquals(3, all.size());
    }

    @Test
    void testGetFilteredUsersAnalyticsWithAllFilters() {
        org.springframework.samples.smartcheckin.company.Company compA = new org.springframework.samples.smartcheckin.company.Company();
        compA.setId(10);
        compA.setName("Company A");

        Authorities empAuth = new Authorities();
        empAuth.setAuthority("EMPLOYEE");

        User u1 = new User();
        u1.setId(1);
        u1.setUsername("alicedoe");
        u1.setFirstName("Alice");
        u1.setLastName("Doe");
        u1.setPersonalCode("P001");
        u1.setLocator("MG");
        u1.setAuthority(empAuth);
        u1.setCompany(compA);
        u1.setIsWorking(true);

        when(userRepository.findAll()).thenReturn(List.of(u1));

        List<UserAnalyticsDTO> res = analyticsService.getFilteredUsersAnalytics(
                "alice", 10, "MG", "EMPLOYEE", "ALL", true
        );
        assertEquals(1, res.size());
        assertEquals("Alice", res.getFirst().getFirstName());

        List<UserAnalyticsDTO> resMismatch = analyticsService.getFilteredUsersAnalytics(
                "alice", 10, "VF", "EMPLOYEE", "ALL", true
        );
        assertEquals(0, resMismatch.size());
    }

    @Test
    void testGetFilteredUserFormations() {
        org.springframework.samples.smartcheckin.company.Company compA = new org.springframework.samples.smartcheckin.company.Company();
        compA.setId(10);
        compA.setName("Company A");

        Authorities empAuth = new Authorities();
        empAuth.setAuthority("EMPLOYEE");

        User u1 = new User();
        u1.setId(1);
        u1.setUsername("alicedoe");
        u1.setFirstName("Alice");
        u1.setLastName("Doe");
        u1.setPersonalCode("P001");
        u1.setLocator("MG");
        u1.setAuthority(empAuth);
        u1.setCompany(compA);
        u1.setIsWorking(true);

        Formation f1 = new Formation();
        f1.setId(100);
        f1.setName("Docker 101");
        f1.setFormationDate(LocalDateTime.of(2026, Month.AUGUST, 15, 9, 0));

        FormationAttendance att = new FormationAttendance();
        att.setFormation(f1);
        att.setUser(u1);
        att.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 15, 9, 0));
        att.setCheckOutDate(LocalDateTime.of(2026, Month.AUGUST, 15, 11, 30));
        att.setSignature("sig_base64");

        when(userRepository.findAll()).thenReturn(List.of(u1));
        when(attendanceRepository.findByUserIdIn(List.of(1))).thenReturn(List.of(att));

        List<UserFormationExportDTO> records = analyticsService.getFilteredUserFormations(
                new AnalyticsService.UserFormationFilterCriteria(
                        null, 10, "MG", "EMPLOYEE", "ALL", true, null, null, "ATTENDED", null, null
                )
        );

        assertEquals(1, records.size());
        UserFormationExportDTO r = records.getFirst();
        assertEquals("Docker 101", r.getFormationName());
        assertEquals("Alice Doe", r.getFullName());
        assertEquals("ASISTIÓ", r.getStatus());
        assertEquals(150L, r.getDurationMinutes());
        assertTrue(r.getDurationHoursFormatted().contains("2h 30m"));
        assertTrue(r.getHasSignature());
    }
}