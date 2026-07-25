package org.springframework.samples.petclinic.user;

import org.springframework.samples.petclinic.model.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "appusers")
public class User extends BaseEntity {

	@Column(unique = true)
	private String username;

	private String password;

	@Column(unique = true, length = 4)
	private String personalCode;

	@NotNull
	private String firstName;

	@NotNull
	private String lastName;

	@NotNull
	private Boolean isWorking = false;

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

}
