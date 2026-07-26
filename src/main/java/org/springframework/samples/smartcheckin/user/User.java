package org.springframework.samples.smartcheckin.user;

import java.util.List;

import org.springframework.samples.smartcheckin.formation.FormationAttendance;

import java.time.LocalDateTime;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, exclude = {"formationAttendances"})
@Entity
@Table(name = "appusers")
public class User extends BaseEntity {

	@NotBlank
	@Size(min = 1, max = 255)
	@Column(unique = true)
	private String username;

	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String password;

	@NotBlank
	@Size(min = 4, max = 4)
	@Column(unique = true, length = 4)
	private String personalCode;

	@NotBlank
	@Size(max = 255)
	private String firstName;

	@NotBlank
	@Size(max = 255)
	private String lastName;

	@NotNull
	@Column(name = "is_working")
	private Boolean isWorking = false;

	@Column(name = "failed_login_attempts")
	private Integer failedLoginAttempts = 0;

	@Column(name = "account_locked_until")
	private LocalDateTime accountLockedUntil;

	@Transient
	public String getEmployeeBlock() {
		String fName = this.firstName != null ? this.firstName.replace(" ", "_") : "";
		String lName = this.lastName != null ? this.lastName.replace(" ", "_") : "";
		return String.format("%s_%s_%s", this.personalCode, fName, lName);
	}

	@NotNull
	@ManyToOne(optional = false)
	@JoinColumn(name = "authority")
	Authorities authority;

	public Boolean hasAuthority(String auth) {
		return authority.getAuthority().equals(auth);
	}

	public Boolean hasAnyAuthority(String... authorities) {
		Boolean cond = false;
		for (String auth : authorities) {
			if (auth.equals(authority.getAuthority()))
				cond = true;
		}
		return cond;
	}

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	@JsonIgnore
	private List<FormationAttendance> formationAttendances;

}
