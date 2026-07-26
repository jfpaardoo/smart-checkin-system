package org.springframework.samples.petclinic.user;

import java.util.List;

import org.springframework.samples.petclinic.formation.Formation;
import java.time.LocalDateTime;

import org.springframework.samples.petclinic.model.BaseEntity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, exclude = {"formations"})
@Entity
@Table(name = "appusers")
public class User extends BaseEntity {

	@Column(unique = true)
	private String username;

	@JsonIgnore
	private String password;

	@Column(unique = true, length = 4)
	private String personalCode;

	@NotNull
	private String firstName;

	@NotNull
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

	@ManyToMany(mappedBy = "attendees")
	@JsonIgnore
	private List<Formation> formations;

}
